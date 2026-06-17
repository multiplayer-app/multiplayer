import { QuickJSAsyncContext, QuickJSContext, QuickJSHandle } from 'quickjs-emscripten-core'
import { newQuickJSAsyncWASMModule } from 'quickjs-emscripten'
import { isUrl } from '../RestApiBlock/utils'

const amdModuleCache: Record<string, any> = {}
const esmModuleCache: Record<string, any> = {}
export class JSCodeRunner {
  addVariablesToContext(vm: QuickJSContext, variables: Record<string, any>) {
    Object.keys(variables).forEach(key => {
      const handle: QuickJSHandle = this.getTypedVariableValue(vm, variables[key])
      vm.setProp(vm.global, key, handle)
      handle.dispose()
    })
  }

  getTypedVariableValue(vm: QuickJSContext, variableValue: any): QuickJSHandle {
    switch (typeof variableValue) {
      case 'string':
        return vm.newString(variableValue)
      case 'number':
        return vm.newNumber(variableValue)
      case 'boolean':
        return variableValue ? vm.true : vm.false
      case 'undefined':
        return vm.undefined
      case 'symbol':
        return vm.newSymbolFor(variableValue)
      case 'bigint':
        return vm.newBigInt(variableValue)
      case 'object':
        if (variableValue === null) {
          return vm.null
        }
        if (Array.isArray(variableValue)) {
          const arrayHandle = vm.newArray()
          for (let i = 0; i < variableValue.length; i++) {
            const itemHandle = this.getTypedVariableValue(vm, variableValue[i])
            vm.setProp(arrayHandle, i, itemHandle)
            itemHandle.dispose()
          }
          return arrayHandle
        }
        const objectHandle = vm.newObject()
        Object.keys(variableValue).forEach(key => {
          const itemHandle = this.getTypedVariableValue(vm, variableValue[key])
          vm.setProp(objectHandle, key, itemHandle)
          itemHandle.dispose()
        })
        return objectHandle
      default:
        return vm.newString(variableValue)
    }
  }

  addBlockRuntimeAccess(vm: QuickJSAsyncContext, blockName: string, blockHandler: (params: any) => Promise<any>) {
    const blockRunHandle = vm.newAsyncifiedFunction(blockName, async (...args) => {
      const nativeArgs = args.map(vm.dump)
      const result = await blockHandler(nativeArgs)
      return this.getTypedVariableValue(vm, result)
    })
    vm.setProp(vm.global, blockName, blockRunHandle)
    return blockRunHandle
  }

  addConsoleAccess(vm: QuickJSContext) {
    const logFn = vm.newFunction('log', (...args) => {
      const native = args.map(vm.dump)
      console.log('[Notebook]', ...native)
    })
    const consoleObj = vm.newObject()
    for (const method of ['log', 'error', 'warn', 'info', 'debug']) {
      vm.setProp(consoleObj, method, logFn)
    }
    vm.setProp(vm.global, 'console', consoleObj)
    logFn.dispose()
    consoleObj.dispose()
  }

  addCodeHandles(vm: QuickJSContext, codeHandles: Record<string, string>) {
    Object.keys(codeHandles).forEach(key => {
      const code = codeHandles[key]
      const result = vm.evalCode(code)
      const handle = vm.unwrapResult(result)
      vm.setProp(vm.global, key, handle)
      result.dispose()
    })
  }

  async loadEsmModule(moduleName: string, signal?: AbortSignal) {
    const path = moduleName.startsWith('/') ? moduleName : `/${moduleName}`
    if (esmModuleCache[path]) {
      return esmModuleCache[path]
    }
    const response = await fetch(`https://esm.sh${path}`, {
      signal,
    })

    if (!response.ok) {
      throw new Error(`Failed to load module "${moduleName}"`)
    }

    const rawCode = await response.text()

    if (!rawCode.includes('export')) {
      throw new Error(`Module "${moduleName}" is not a valid ESM module try to use require("moduleName") instead`)
    }

    esmModuleCache[path] = rawCode
    return rawCode
  }

  async getAmdModule(vm: QuickJSContext, moduleName: string, signal?: AbortSignal, module: boolean = false) {
    if (amdModuleCache[moduleName]) {
      return amdModuleCache[moduleName]
    }

    let response
    if (isUrl(moduleName)) {
      response = await fetch(moduleName, { signal })
    } else {
      response = await fetch(`https://unpkg.com/${moduleName}?${module ? 'module' : 'main'}`, {
        signal,
      })
    }

    if (!response.ok) {
      return vm.throw(vm.newError(`Failed to load module "${moduleName}"`))
    }

    const rawCode = await response.text()

    amdModuleCache[moduleName] = rawCode

    return rawCode
  }

  addRequireHandler(vm: QuickJSAsyncContext, signal?: AbortSignal): QuickJSHandle {
    const requireFn = vm.newAsyncifiedFunction('require', async (nameHandle): Promise<QuickJSHandle> => {
      const moduleName = vm.dump(nameHandle)
      if (typeof moduleName !== 'string') {
        return vm.throw(vm.newError('Module name must be a string')) as unknown as QuickJSHandle
      }

      try {
        const rawCode = await this.getAmdModule(vm, moduleName, signal)

        // Wrap in an IIFE that returns module.exports
        const wrappedCode = `
          (function() {
            const module = { exports: {} };
            const exports = module.exports;
            (function (exports, module) {
              ${rawCode}
            })(exports, module);
            return module.exports;
          })();
        `

        const resultHandle = await vm.evalCodeAsync(wrappedCode)
        const handle = vm.unwrapResult(resultHandle)

        return handle
      } catch (err: any) {
        return vm.throw(vm.newError(err?.message ?? 'Unknown error')) as unknown as QuickJSHandle
      }
    })

    vm.setProp(vm.global, 'import', requireFn)
    vm.setProp(vm.global, 'require', requireFn)
    return requireFn
  }

  async executeCode(
    code: string,
    variables?: Record<string, any>,
    codeHandles?: Record<string, string>,
    executableBlockHandlers?: Record<string, (params: any) => Promise<any>>,
    timeout = 1000,
    signal?: AbortSignal,
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const module = await newQuickJSAsyncWASMModule()
      const runtime = module.newRuntime()

      if (signal?.aborted) return reject('Execution aborted before start')

      let executionInProgress = true
      const abortHandler = () => {
        if (executionInProgress) reject('Execution aborted')
      }

      signal?.addEventListener('abort', abortHandler)

      runtime.setModuleLoader(async (moduleName, ctx) => {
        return this.loadEsmModule(moduleName, signal)
      })

      const vm = runtime.newContext()
      try {
        const start = Date.now()
        this.addConsoleAccess(vm)
        let handlers: QuickJSHandle[] = []

        if (executableBlockHandlers) {
          handlers = Object.keys(executableBlockHandlers).map(key =>
            this.addBlockRuntimeAccess(vm, key, executableBlockHandlers[key]),
          )
        }

        if (variables) this.addVariablesToContext(vm, variables)
        if (codeHandles) this.addCodeHandles(vm, codeHandles)

        handlers.push(this.addRequireHandler(vm, signal))

        vm.runtime.setMemoryLimit(1024 * 640)
        vm.runtime.setMaxStackSize(1024 * 320)
        vm.runtime.setInterruptHandler(() => Date.now() - start > timeout || signal?.aborted)

        const resultHandle = await vm.evalCodeAsync(code)

        if (signal?.aborted) throw new Error('Execution aborted')

        const finalHandle = vm.unwrapResult(resultHandle)
        const result = vm.dump(finalHandle)

        finalHandle.dispose()
        handlers.forEach(h => h.dispose())
        resolve(result)
      } catch (err: any) {
        reject(`${err?.name || 'RuntimeError'}: ${err?.message || 'Unknown error'}`)
      } finally {
        executionInProgress = false
        signal?.removeEventListener('abort', abortHandler)
        try {
          vm.dispose()
        } catch (disposeErr) {
          console.warn('QuickJS VM disposal error:', disposeErr)
        }
      }
    })
  }
}
