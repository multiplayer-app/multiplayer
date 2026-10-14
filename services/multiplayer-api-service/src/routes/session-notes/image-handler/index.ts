import { default as puppeteer, Page } from 'puppeteer-core'
import { ISessionNoteItem, SessionNoteType } from '@multiplayer/types'
import { getHtml } from './page_template'
import { eventWithTime } from '@rrweb/types'

interface ContentItem {
  type: string;
  attrs: ISessionNoteItem & { metadata: string };
}

interface Content {
  content: ContentItem[];
}

interface SketchData {
  elements: any[];
  appState: {
    backgroundColor: string | null;
  };
  files: any[];
}

const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-accelerated-2d-canvas',
  '--no-first-run',
  '--no-zygote',
  '--disable-gpu',
]

/**
 * Reuses the same puppeteer + rrweb pipeline as session note sketch/bookmark screenshots.
 * When a sketch annotation exists at the requested timestamp its metadata is passed in and
 * rendered as an overlay; otherwise a bookmark renders the bare recording frame.
 */
export async function generateSnapshotAtTimestamp(
  events: eventWithTime[],
  timestamp: number,
  sketchMetadata?: string,
): Promise<Uint8Array | string | undefined> {
  const snapshotId = `snapshot-${Math.floor(timestamp)}`
  const hasSketch = !!sketchMetadata
  const images = await generateImagesFromEvents(events, {
    content: [
      {
        type: 'session-note-block',
        attrs: {
          id: snapshotId,
          type: hasSketch ? SessionNoteType.Sketch : SessionNoteType.Bookmark,
          timestamp: Math.floor(timestamp),
          metadata: sketchMetadata ?? '',
        } as ISessionNoteItem & { metadata: string },
      },
    ],
  })

  return (
    images.find((image) => image.id === snapshotId)?.data ?? images[0]?.data
  )
}

export async function generateImagesFromEvents(
  events: eventWithTime[],
  content: Content,
): Promise<
  {
    data: Uint8Array | string;
    id: string;
  }[]
> {
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    headless: true,
    args: PUPPETEER_ARGS,
  })
  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()

    const unpackedEvents = events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

    const meta = unpackedEvents.find((e) => e.type === 4)
    const { width, height } = meta?.data || { width: 1280, height: 720 }

    await page.setViewport({ width, height })
    await page.setRequestInterception(true)
    page.on('request', (req) => {
      const resourceType = req.resourceType()
      if (['media'].includes(resourceType)) {
        req.abort()
      } else {
        req.continue()
      }
    })

    page.setDefaultTimeout(5000)
    page.setDefaultNavigationTimeout(5000)

    const canvases = content.content.filter(
      ({ type, attrs }) =>
        type === 'session-note-block' &&
        (attrs.type === SessionNoteType.Sketch ||
          attrs.type === SessionNoteType.Bookmark),
    )

    const images: {
      data: Uint8Array | string;
      id: string;
    }[] = []

    for (const { attrs } of canvases) {
      let sketch: SketchData | undefined = undefined

      if (attrs?.type === SessionNoteType.Sketch) {
        const parsedSketch = JSON.parse(attrs?.metadata || '{}')
        sketch = {
          elements: parsedSketch.elements.filter(({ isDeleted }) => !isDeleted),
          appState: {
            backgroundColor: null,
          },
          files: parsedSketch.files || [],
        }
      }

      const image = await htmlToImage(
        page,
        unpackedEvents,
        attrs.timestamp || 0,
        sketch,
        width,
        height,
      )
      if (image) {
        images.push({
          data: image,
          id: attrs.id || '',
        })
      }
    }

    return images
  } finally {
    await page?.close()
    await browser.close()
  }
}

async function htmlToImage(
  page: Page,
  events: any[],
  timestamp: number,
  sketch: SketchData | undefined,
  width: number,
  height: number,
): Promise<Uint8Array | string | undefined> {
  const html = getHtml({
    width,
    height,
    events,
    sketch,
    timestamp,
  })

  await page.setContent(html, { waitUntil: 'domcontentloaded' })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await page.waitForFunction(() => window.pageReady === true, {
    timeout: 10000,
  })

  const bodyBoundingBox = await page.evaluate(() => {
    const body = document.body
    const rect = body.getBoundingClientRect()
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    }
  })

  const screenshot = await page.screenshot({
    type: 'jpeg',
    quality: 80,
    encoding: 'binary',
    clip: bodyBoundingBox,
  })

  return screenshot
}
