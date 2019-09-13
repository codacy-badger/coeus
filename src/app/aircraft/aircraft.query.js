import { ContextMiddleware } from '~/middleware/utils'
import { getAircraft, getAllAircrafts } from './aircraft.service'

module.exports = {
  showSingleAircraft: (root, args, context) =>
    ContextMiddleware(context, 'canEditAircraft').then(() =>
      getAircraft(args)
    ),
  showAllAircrafts: (root, args, context) =>
    ContextMiddleware(context, 'canEditAircraft').then(() =>
      getAllAircrafts(args)
    )
}