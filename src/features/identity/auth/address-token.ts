export const tokenInAddress = () =>
  new URLSearchParams(window.location.hash.slice(1)).get("token") || null

export function forgetAddressFragment() {
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search
  )
}
