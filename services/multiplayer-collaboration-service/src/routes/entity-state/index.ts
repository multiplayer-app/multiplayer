import express from 'express'
import getEntityState from './get'
import updateEntityState from './update'

const { Router } = express
const router = Router()

router.route('/').get(getEntityState).post(updateEntityState)

export default router
