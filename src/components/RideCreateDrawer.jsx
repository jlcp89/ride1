import DrawerShell from './DrawerShell'
import RideEditPanel from './RideEditPanel'

/**
 * Drawer that opens in create-mode. Thin wrapper around DrawerShell +
 * RideEditPanel — kept separate from RideDetailDrawer so the detail drawer
 * doesn't have to handle "no rideId, skip the fetch" as a special case.
 */
export default function RideCreateDrawer({ users, onClose, onCreated }) {
  return (
    <DrawerShell onClose={onClose} ariaLabelledBy="drawer-title">
      <RideEditPanel
        mode="create"
        users={users}
        onCancel={onClose}
        onSaved={(ride) => {
          onCreated?.(ride)
          onClose()
        }}
      />
    </DrawerShell>
  )
}
