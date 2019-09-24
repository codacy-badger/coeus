import DataLoader from 'dataloader'
import { connectionFromMongoCursor, mongooseLoader } from '@entria/graphql-mongoose-loader';

import Aircraft from './aircraft.model'

export const getAircraft = () => new DataLoader(ids => mongooseLoader(Aircraft, ids))