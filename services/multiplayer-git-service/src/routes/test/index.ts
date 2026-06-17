import express from 'express'
import throwError from './throw-error'

const { Router } = express
const router = Router({ mergeParams: true })

router.route('/throw-error').get(
  throwError,
)

export default router
