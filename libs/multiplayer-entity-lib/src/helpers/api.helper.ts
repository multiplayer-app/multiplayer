import YAML from 'js-yaml'
import * as Y from 'yjs'
import {
  ApiType,
  IRadarDetection,
  EntityType,
} from '@multiplayer/types'
import Joi from 'joi'
import { OpenAPIV3 } from 'openapi-types'
import Delta from 'quill-delta'
import {
  Openapiv2Setters,
  Openapiv2YMapSetters,
  Openapiv3xSetters,
  Openapiv3xYMapSetters,
} from '../setters'
import { ComponentsV2 } from '../setters/api/openapiv2.setters'
import {
  getNestedProperty,
  deepAssign,
  setNestedProperty,
  isObjectEmpty,
} from '../util'
import { ApiTemplates } from '../templates'
import {
  convertDataToYDoc,
  convertYDocToData,
} from '../converters'
import { EntityDiffPatch } from '../'

const openapiV3Schema = Joi.object({
  openapi: Joi.string(),
  tags: Joi.array().items(Joi.object({
    name: Joi.string().required(),
  }).unknown()),
  components: Joi.object({
    callbacks: Joi.object(),
    examples: Joi.object(),
    headers: Joi.object(),
    links: Joi.object(),
    parameters: Joi.object(),
    requestBodies: Joi.object(),
    responses: Joi.object(),
    schemas: Joi.object(),
    securitySchemes: Joi.object(),
  }),
  paths: Joi.object(),
}).unknown()

const openapiV2Schema = Joi.object({
  swagger: Joi.string(),
  tags: Joi.array().items(Joi.object({
    name: Joi.string().required(),
  }).unknown()),
  definitions: Joi.object(),
  parameters: Joi.object(),
  securityDefinitions: Joi.object(),
  responses: Joi.object(),
  paths: Joi.object(),
}).unknown()

const schemas = {
  [ApiType.OPENAPI]: {
    2: openapiV2Schema,
    3: openapiV3Schema,
  },
}

export class ApiHelper {
  static readonly UNKNOWN_VERSION = 'unknown'

  static normalizePath(path: string) {
    return path.replace(/:([^/]+)/g, '{$1}')
  }

  static getNormalizedPath(httpEndpoint, apiDocument) {
    let basePaths:string[] = []
    if (apiDocument.basePath) {
      basePaths.push(apiDocument.basePath)
    }
    if (apiDocument.servers) {
      basePaths = apiDocument.servers.map((s) => s.url)
    }

    for (let i = 0; i < basePaths.length; i++) {
      const baseUrl = basePaths[i]
      if (httpEndpoint.startsWith(baseUrl)) {
        return ApiHelper.normalizePath(httpEndpoint.replace(baseUrl, ''))
      }
    }
    return httpEndpoint
  }

  static getPathObject(httpEndpoint, apiDocument) {
    const paths = apiDocument.paths
    if (Object.prototype.hasOwnProperty.call(paths, httpEndpoint)) {
      return paths[httpEndpoint]
    }

    let basePaths:string[] = []
    if (apiDocument.basePath) {
      basePaths.push(apiDocument.basePath)
    }
    if (apiDocument.servers) {
      basePaths = apiDocument.servers.map((s) => s.url)
    }

    for (let i = 0; i < basePaths.length; i++) {
      const baseUrl = basePaths[i]
      if (httpEndpoint.startsWith(baseUrl)) {
        const pathToCheck = ApiHelper.normalizePath(httpEndpoint.replace(baseUrl, ''))
        if (Object.prototype.hasOwnProperty.call(paths, pathToCheck)) {
          return paths[pathToCheck]
        }
      }
    }
    return null
  }

  static findExtraFields(originalSchema, partialSchema) {
    const extraFields = {}

    if (partialSchema.type && partialSchema.type !== originalSchema.type) {
      return partialSchema
    }

    function compareSchemas(original, partial, path = '') {
      if (
        !original ||
        typeof original !== 'object' ||
        !partial ||
        typeof partial !== 'object'
      ) {
        return
      }

      for (const key in partial) {
        const currentPath = path ? `${path}.${key}` : key
        if (!(key in original)) {
          // Key does not exist in the original schema
          setNestedProperty(extraFields, currentPath, partial[key])
        } else if (
          typeof partial[key] !== typeof original[key] ||
          (key !== 'properties' &&
            partial[key].type &&
            partial[key].type !== original[key].type)
        ) {
          // Type is different, consider the whole object as extra
          setNestedProperty(extraFields, currentPath, partial[key])
        } else {
          // TODO: Fix later
          // eslint-disable-next-line
          if (Array.isArray(original[key].oneOf)) {
            original[key].oneOf.forEach((subSchema) => {
              compareSchemas(subSchema, partial[key], currentPath)
            })
          } else if (Array.isArray(original[key].allOf)) {
            original[key].allOf.forEach((subSchema) => {
              compareSchemas(subSchema, partial[key], currentPath)
            })
          } else if (Array.isArray(original[key].anyOf)) {
            original[key].anyOf.forEach((subSchema) => {
              compareSchemas(subSchema, partial[key], currentPath)
            })
          } else if (original[key].items && partial[key].items) {
            compareSchemas(
              original[key].items,
              partial[key].items,
              `${currentPath}.items`,
            )
          } else {
            compareSchemas(original[key], partial[key], currentPath)
          }
        }
      }

      if (getNestedProperty(extraFields, path)) {
        if (partial.type && path.split('.').pop() !== 'properties') {
          setNestedProperty(extraFields, `${path}.type`, partial.type)
        }
        if (original.$originalRef) {
          setNestedProperty(extraFields, `${path}.$ref`, original.$originalRef)
        }
        if (original.oneOf) {
          setNestedProperty(extraFields, `${path}.oneOf`, original.oneOf)
        }
        if (original.allOf) {
          setNestedProperty(extraFields, `${path}.allOf`, original.allOf)
        }
        if (original.anyOf) {
          setNestedProperty(extraFields, `${path}.anyOf`, original.anyOf)
        }
      }
    }

    compareSchemas(originalSchema, partialSchema)

    if (!isObjectEmpty(extraFields)) {
      extraFields['type'] = partialSchema.type
      const { $originalRef, oneOf, allOf, anyOf, type } = originalSchema

      if ($originalRef) {
        extraFields['$ref'] = $originalRef
      }
      // if (allOf) {
      //   extraFields = { type, allOf: [...allOf, extraFields] };
      // }
      // if (oneOf) {
      //   extraFields = { type, oneOf: [...oneOf, extraFields] };
      // }
      // if (anyOf) {
      //   extraFields = { type, anyOf: [...anyOf, extraFields] };
      // }
    }

    return extraFields
  }

  static applyExtraFieldsToEmptyDoc(
    extraFields,
    basePath,
    openApiDoc,
  ) {
    let path = basePath

    if (typeof extraFields !== 'object') {
      setNestedProperty(openApiDoc, path, extraFields)
      return
    }

    const { $ref, allOf, oneOf, anyOf, ...rest } = extraFields
    if ($ref) {
      setNestedProperty(openApiDoc, basePath, { $ref: $ref })
      path = $ref.split('/').slice(1)
    }

    for (const key in rest) {
      if (Object.prototype.hasOwnProperty.call(rest, key)) {
        const val = rest[key]
        const newPath = [...path, key]
        ApiHelper.applyExtraFieldsToEmptyDoc(val, newPath, openApiDoc)
      }
    }
  }

  static convertDiffToOpenApiDoc(diff) {
    const apiDocument = ApiTemplates.contentsTemplate()
    apiDocument.paths = diff.paths
    apiDocument.components = diff.components
    const yDoc = convertDataToYDoc(EntityType.API, {
      contents: JSON.stringify(apiDocument),
      extension: 'json',
      metadata: { version: '3.0.0', provider: ApiType.OPENAPI },
    }) // Apply setters
    const staticDoc = convertYDocToData(EntityType.API, yDoc)

    return staticDoc
  }

  static getParsedJson(
    text: string,
    extension: string,
  ): Record<string, unknown> | undefined {
    try {
      if (extension === 'json') {
        return JSON.parse(text)
      }
      if (extension === 'yaml' || extension === 'yml') {
        return YAML.load(text) as Record<string, unknown>
      }
      return undefined
    } catch (err) {
      return undefined
    }
  }

  static isConvertibleApi(provider: string | undefined): boolean {
    const convertableApis = {
      [ApiType.OPENAPI]: true,
    }
    return convertableApis[provider || ApiType.OTHER]
  }

  static fetchMetadata(
    extension: string = 'txt',
    nonParsedContents: string,
    parsedObject?: Record<string, unknown>): { provider: ApiType, version: string } {
    const providerByExtension = {
      graphql: ApiType.GRAPHQL,
      proto: ApiType.GRPC,
    }
    if (providerByExtension[extension]) {
      return {
        provider: providerByExtension[extension],
        version: this.UNKNOWN_VERSION,
      }
    }

    const parsableExtensions = {
      json: true,
      yml: true,
      yaml: true,
    }
    let data: { provider: ApiType, version?: string } = {
      provider: ApiType.OTHER,
      version: this.UNKNOWN_VERSION,
    }
    if (parsableExtensions[extension]) {
      data = (parsedObject) ?
        ApiHelper.getMetadataFromSource(parsedObject) :
        ApiHelper.assumeMetadataByContents(nonParsedContents)
    }
    return {
      version: this.UNKNOWN_VERSION,
      ...data,
    }
  }

  static getMetadataFromSource(source: Record<string, unknown> | undefined) {
    if (source?.asyncapi) {
      return {
        provider: ApiType.ASYNCAPI,
        version: source.asyncapi.toString(),
        info: source.info,
      }
    }
    if (source?.openapi) {
      return {
        provider: ApiType.OPENAPI,
        version: source.openapi.toString(),
        info: source.info,
      }
    }
    if (source?.swagger) {
      return {
        provider: ApiType.OPENAPI,
        version: source.swagger.toString(),
        info: source.info,
      }
    }
    return { provider: ApiType.OTHER }
  }

  static assumeMetadataByContents(text: string) {
    if (text.includes('asyncapi')) {
      return { provider: ApiType.ASYNCAPI }
    }
    if (text.includes('openapi') || text.includes('swagger')) {
      return { provider: ApiType.OPENAPI }
    }
    return { provider: ApiType.OTHER }
  }

  static isValidApi(
    provider: ApiType = ApiType.OTHER,
    version: string = ApiHelper.UNKNOWN_VERSION,
    apiDoc: unknown): boolean {
    const schema = schemas[provider]?.[version.charAt(0)]
    if (!schema) {
      return false
    }
    const { error } = schema.validate(apiDoc)
    return !error
  }

  static getOpenapiSetters(version = ''): typeof Openapiv2Setters | typeof Openapiv3xSetters | undefined {
    if (version.startsWith('2.')) {
      return Openapiv2Setters
    }
    if (version.startsWith('3.')) {
      return Openapiv3xSetters
    }

    return undefined
  }

  static removeKeys(obj, keys) {
    if (Array.isArray(obj)) {
      obj.forEach((item) => ApiHelper.removeKeys(item, keys))
    } else if (typeof obj === 'object' && obj !== null) {
      keys.forEach((key) => {
        delete obj[key]
      })
      Object.values(obj).forEach((value) => ApiHelper.removeKeys(value, keys))
    }
    return obj
  }

  static getNormalizedSchema(schema) {
    return ApiHelper.removeKeys(JSON.parse(schema), ['__timestamp'])
  }

  static getOpenapiYMapSetters(version = ''): typeof Openapiv2YMapSetters | typeof Openapiv3xYMapSetters {
    if (version.startsWith('2.')) {
      return Openapiv2YMapSetters
    }

    return Openapiv3xYMapSetters
  }

  static getTextFromJson(data: any, extension: string): string {
    if (extension === 'yaml' || extension === 'yml') {
      return YAML.dump(data)
    }
    if (extension === 'json') {
      return JSON.stringify(data, null, 2)
    }
    return data.toString()
  }

  static getOpenapiSetterInstance(doc: Y.Doc) {
    const metadataMap = doc.getMap('metadata') as Y.Map<string>
    const version = metadataMap.get('version') || 'unknown'
    const provider = metadataMap.get('provider') || ApiType.OTHER
    const helperConstructor = ApiHelper.getOpenapiSetters(version)
    if (!helperConstructor || provider !== ApiType.OPENAPI) {
      throw new Error('Action is allowed only for openapi files')
    }
    return new helperConstructor(doc)
  }

  static addComponent(doc: Y.Doc, component: {
    type: keyof OpenAPIV3.ComponentsObject | keyof ComponentsV2,
    key: string,
    data: Record<string, any>
  }) {
    const helper = ApiHelper.getOpenapiSetterInstance(doc)
    helper.addComponent(component)
    return doc
  }

  static addPath(doc: Y.Doc, path: {
    pattern: string,
    method: string,
    object: any
  }) {
    const helper = ApiHelper.getOpenapiSetterInstance(doc)
    helper.addPath(path)
    return doc
  }

  static updateDocTextWithOpenapiObject(doc: Y.Doc, apiObject: any) {
    const metadataMap = doc.getMap('metadata') as Y.Map<string>
    const provider = metadataMap.get('provider') || ApiType.OTHER
    const version = metadataMap.get('version')
    if (provider !== ApiType.OPENAPI) {
      throw new Error('Action is allowed only for openapi files')
    }
    if (!apiObject ||
      !ApiHelper.isConvertibleApi(provider) ||
      !ApiHelper.isValidApi(ApiType[provider], version, apiObject)) {
      throw new Error('Invalid api object')
    }

    const text = doc.getText('text')
    const extension = metadataMap.get('extension') || 'txt'

    const setterConstructor = ApiHelper.getOpenapiYMapSetters(version)
    const setter = new setterConstructor(doc)
    setter.setFields(apiObject)
    const updatedText = ApiHelper.getTextFromJson(apiObject, extension)
    const current = new Delta(text.toDelta())
    const newDeltas = current.diff(new Delta().insert(updatedText))
    text.applyDelta(newDeltas.ops)
    return doc
  }

  static getFullSchema(schemaRef, openApiDoc) {
    if (!schemaRef) return

    const visitedRefs = new Set()

    function resolveRef(ref) {
      const refPath = ref.split('/').slice(1) // Remove the initial '#'
      let resolved = openApiDoc
      refPath.forEach((part) => {
        resolved = resolved[part]
      })
      return { ...resolved, $originalRef: ref }
    }

    function traverseSchema(schema) {
      if (!schema || visitedRefs.has(schema)) return schema

      visitedRefs.add(schema)

      if (schema.$ref) {
        const resolvedSchema = resolveRef(schema.$ref)
        return traverseSchema(resolvedSchema)
      }

      if (schema.properties) {
        for (const property in schema.properties) {
          schema.properties[property] = traverseSchema(
            schema.properties[property],
          )
        }
      }

      if (schema.items) {
        schema.items = traverseSchema(schema.items)
      }

      if (schema.allOf) {
        schema.allOf = schema.allOf.map((subSchema) => traverseSchema(subSchema))
        schema.allOf.forEach((subSchema) => {
          schema = deepAssign(schema, subSchema)
        })
      }

      if (schema.oneOf) {
        schema.oneOf = schema.oneOf.map((subSchema) => traverseSchema(subSchema))
        schema.oneOf.forEach((subSchema) => {
          schema = deepAssign(schema, subSchema)
        })
      }

      if (schema.anyOf) {
        schema.anyOf = schema.anyOf.map((subSchema) => traverseSchema(subSchema))
        schema.anyOf.forEach((subSchema) => {
          schema = deepAssign(schema, subSchema)
        })
      }

      return schema
    }

    return traverseSchema(
      schemaRef.$ref ? resolveRef(schemaRef.$ref) : schemaRef,
    )
  }

  static getDocumentJson(doc: Y.Doc) {
    const metadataMap = doc.getMap('metadata') as Y.Map<string>
    const extension = metadataMap.get('extension') || 'txt'
    const text = doc.getText('text').toJSON()

    const openApiDoc = ApiHelper.getParsedJson(text, extension) as OpenAPIV3.Document | undefined

    return openApiDoc
  }

  // static getDocumentAndPayloadDiff = (
  //   detections: IRadarDetection[],
  //   doc: Y.Doc,
  // ): any => {
  //   const metadataMap = doc.getMap('metadata') as Y.Map<string>
  //   const extension = metadataMap.get('extension') || 'txt'
  //   const text = doc.getText('text').toJSON()

  //   const openApiDoc = ApiHelper.getParsedJson(text, extension) as OpenAPIV3.Document | undefined

  //   if (!openApiDoc) {
  //     throw new Error('Failed to parse contents')
  //   }

  //   const changes = {
  //     paths: {},
  //     components: {},
  //   }

  //   detections.forEach((detection) => {
  //     const method = detection?.httpMethod?.toLowerCase() as string
  //     const normalizedEndpoint = ApiHelper.getNormalizedPath(
  //       detection.httpEndpoint,
  //       openApiDoc,
  //     )

  //     const pathObject = ApiHelper.getPathObject(detection.httpEndpoint, openApiDoc)
  //     const pathItem = getNestedProperty(pathObject, [method])
  //     const responsesPath = ['paths', normalizedEndpoint, method, 'responses']
  //     if (pathItem) {
  //       ((detection as any).restResponsePayloads || []).forEach(({ httpStatus, schema }) => {
  //         const statusPath = [
  //           httpStatus,
  //           'content',
  //           'application/json',
  //           'schema',
  //         ]
  //         const parsedSchema = schema ? ApiHelper.getNormalizedSchema(schema) : undefined
  //         const changesPath = [...responsesPath, ...statusPath]
  //         const responseSchema = getNestedProperty(pathItem, [
  //           'responses',
  //           ...statusPath,
  //         ])
  //         if (parsedSchema) {
  //           if (responseSchema) {
  //             const sourceSchemaObject = ApiHelper.getFullSchema(
  //               responseSchema,
  //               openApiDoc,
  //             )
  //             const extraFields = ApiHelper.findExtraFields(
  //               sourceSchemaObject,
  //               parsedSchema,
  //             )
  //             if (Object.keys(extraFields).length > 0) {
  //               ApiHelper.applyExtraFieldsToEmptyDoc(extraFields, changesPath, changes)
  //             }
  //           } else {
  //             setNestedProperty(changes, changesPath, parsedSchema)
  //           }
  //         }
  //       })
  //     } else {
  //       setNestedProperty(changes, responsesPath, {});

  //       (detection.restResponsePayloads || []).forEach(({ httpStatus, schema }) => {
  //         if (schema) {
  //           const statusPath = [
  //             httpStatus,
  //             'content',
  //             'application/json',
  //             'schema',
  //           ]
  //           const changesPath = [...responsesPath, ...statusPath]
  //           setNestedProperty(changes, changesPath, ApiHelper.getNormalizedSchema(schema))
  //         }
  //       })
  //     }
  //   })

  //   return changes
  // }

  static mergeChangesWithCurrentDocument = (currentDoc, changesDoc) => {
    return deepAssign(currentDoc, changesDoc)
  }

  static getDocumentDiffPatch = (currentDoc, changesDoc) => {
    const patcher = EntityDiffPatch.getDiffPatcher(EntityType.API)
    return patcher.getDiff(currentDoc, changesDoc)
  }

  static getMethodInitialData = (
    key: OpenAPIV3.HttpMethods,
  ): OpenAPIV3.OperationObject => {
    const baseValue: OpenAPIV3.OperationObject = {
      summary: '',
      description: '',
      responses: {
        '200': {
          description: 'OK',
        },
      },
    }
    switch (key) {
      case OpenAPIV3.HttpMethods.POST:
      case OpenAPIV3.HttpMethods.PUT:
        return {
          ...baseValue,
          requestBody: {
            description: '',
            required: true,
            content: {
              'application/json': {},
            },
          },
        }
      default:
        return baseValue
    }
  }

  static applyPatchToYDocumentObject = (
    type: 'paths' | 'components',
    object: any,
    key: string,
    patch: any,
  ) => {
    const targetObject = object.get(type) as Y.Map<any>
    const currentState = targetObject.get(key)
    const patcher = EntityDiffPatch.getDiffPatcher(EntityType.API)
    if (Array.isArray(patch) && patch.length === 1) { // New path or schema
      const parts = key.split(':')
      const method = parts.pop() as OpenAPIV3.HttpMethods
      const baseData = ApiHelper.getMethodInitialData(method)
      targetObject.set(key, { ...baseData, ...patch[0] })
    } else {
      const [success, newState] = patcher.applyPatch(JSON.parse(JSON.stringify(currentState)), patch)
      if (success) {
        targetObject.set(key, newState)
      }
    }
  }
}
