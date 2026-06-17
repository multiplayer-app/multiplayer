import { EntityDocument } from './entity-document'
import { EntityConverter, PlatformComponentInformationSetters } from '@multiplayer/entity'
import { EntityType, IEntity } from '@multiplayer/types'

export class PlatformComponentDocument extends EntityDocument {
  async init(entity: IEntity, timestamp: number) {
    await super.init(entity, timestamp)

    const info = this.getMap('information')
    info.observe(async (event, transaction) => {
      const keysChanged = Array.from(event.keysChanged)
      keysChanged.forEach((key) => this.summaryTimestamps[key] = Date.now())

      if (!transaction.local) return
      const summary = this.getSummary()

      const hasSummaryUpdate = keysChanged.some((key: string) => key in summary )
      if (hasSummaryUpdate) {
        await this.debouncedMetadataUpdate()
      }
    })
  }

  protected getSummary(): Record<string, string> {
    return EntityConverter.getSummaryFromData(
      EntityType.PLATFORM_COMPONENT,
      { information: this.getMap('information').toJSON() },
    )
  }

  public setSummary(metadata: Record<string, string>, timestamp: number) {
    const summary = EntityConverter.getSummaryFromData(
      EntityType.PLATFORM_COMPONENT, { information: metadata })
    const oldSummary = this.getSummary()
    if (JSON.stringify(summary) === JSON.stringify(oldSummary))
      return

    const keysToIgnore = Object.keys(summary).filter((key) =>
      this.summaryTimestamps[key] >= timestamp
    )
    keysToIgnore.forEach((key) => {
      summary[key] = oldSummary[key]
    })

    const setters = new PlatformComponentInformationSetters(this.getMap('information'))
    setters.setFields(summary)
  }
}
