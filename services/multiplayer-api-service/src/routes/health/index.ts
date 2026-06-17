import express from 'express'
import health from './health'

const { Router } = express
const router = Router()

router.route('/').get(health)

export default router
