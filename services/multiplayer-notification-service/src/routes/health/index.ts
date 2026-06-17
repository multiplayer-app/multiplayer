import { Router } from 'express'
import health from './health'

const router = Router()

router.route('/').get(health)

export default router as Router
