import { demoAdapter } from './demoAdapter'
import type { TryOnAdapter } from './types'

export type { TryOnAdapter, TryOnGarment, TryOnRequest, TryOnResult, AdapterInfo } from './types'
export { DEMO_DISCLOSURE } from './demoAdapter'

/**
 * Adapter registry. Only the demo adapter exists today.
 * When a real model is connected and tested, add its adapter here and select it in `getActiveAdapter`.
 */
const adapters: TryOnAdapter[] = [demoAdapter]

export function getActiveAdapter(): TryOnAdapter {
  return adapters[0]
}
