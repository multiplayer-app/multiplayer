import express from 'express'
import webhookBitbucket from './webhook-bitbucket'
import webhookGitlab from './webhook-gitlab'

const { Router } = express
const router = Router()

router.route('/bitbucket').post(
  webhookBitbucket,
)

router.route('/gitlab').post(
  webhookGitlab,
)

export default router
