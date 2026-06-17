import 'openai/shims/node'
import OpenAI from 'openai'
import {
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  OPENAI_ORG_ID,
} from '../config'

const openai = new OpenAI({
  baseURL: OPENAI_BASE_URL,
  apiKey: OPENAI_API_KEY,
  organization: OPENAI_ORG_ID,
})

export default openai
