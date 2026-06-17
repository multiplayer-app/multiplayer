import express from 'express'
import healthz from './healthz'

const { Router } = express
const router = Router()

router.route('/').get(healthz)

export default router
