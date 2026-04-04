import L from 'leaflet'

/**
 * Shared map icon factories for all map components.
 */

/** Pulsing orange dot for user's GPS location */
export const userLocationIcon = new L.DivIcon({
  html: `<div class="user-location-dot" style="
    width: 18px; height: 18px;
    background: #f97316;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
})

/** Client marker for the main map view */
export function createClientIcon(photoUrl: string | null, name: string) {
  if (photoUrl) {
    return new L.DivIcon({
      html: `<div style="
        width: 44px; height: 44px;
        border-radius: 50%;
        border: 3px solid white;
        overflow: hidden;
        background: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
        outline: 2px solid rgba(15,23,42,0.15);
      ">
        <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;" />
      </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
      className: '',
    })
  }

  const initial = name.charAt(0).toUpperCase()
  return new L.DivIcon({
    html: `<div style="
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 3px solid white;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 17px;
      color: white;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1);
    ">${initial}</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24],
    className: '',
  })
}

/** Numbered route stop - small circle, numbers only (no photos) */
export function createStopIcon(num: number, totalStops: number) {
  const color = num === 1 ? '#22c55e' : num === totalStops ? '#ef4444' : '#f97316'

  return new L.DivIcon({
    html: `<div style="
      background: ${color};
      color: white;
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2.5px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    className: '',
  })
}

/** Delivered stop - green circle with checkmark */
export function createDeliveredStopIcon(_num: number) {
  return new L.DivIcon({
    html: `<div style="
      background: #22c55e;
      color: white;
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2.5px solid white;
      box-shadow: 0 2px 6px rgba(34,197,94,0.3);
    ">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 7.5L5.5 10L11 4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    className: '',
  })
}

/** Failed delivery stop - red circle with X */
export function createFailedStopIcon(_num: number) {
  return new L.DivIcon({
    html: `<div style="
      background: #ef4444;
      color: white;
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2.5px solid white;
      box-shadow: 0 2px 6px rgba(239,68,68,0.3);
    ">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 3L9 9M9 3L3 9" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    className: '',
  })
}

/** Orange map pin for location picker and client detail */
export const locationPinIcon = new L.DivIcon({
  html: `<div style="
    position: relative;
    width: 30px; height: 40px;
  ">
    <div style="
      width: 30px; height: 30px;
      background: #f97316;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
    </div>
    <div style="
      width: 0; height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-top: 10px solid #f97316;
      margin: -3px auto 0;
    "></div>
  </div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 40],
  popupAnchor: [0, -42],
  className: '',
})

/** Small start marker (green circle with arrow) */
export const startMarkerIcon = new L.DivIcon({
  html: `<div style="
    width: 24px; height: 24px;
    background: #22c55e;
    border: 2.5px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(34,197,94,0.35);
  ">
    <div style="
      width: 0; height: 0;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-left: 7px solid white;
      margin-left: 2px;
    "></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
  className: '',
})

/** Small end marker (red circle with flag) */
export const endMarkerIcon = new L.DivIcon({
  html: `<div style="
    width: 24px; height: 24px;
    background: #ef4444;
    border: 2.5px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(239,68,68,0.35);
  ">
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M2 6.5L4.5 9L10 3" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
  className: '',
})
