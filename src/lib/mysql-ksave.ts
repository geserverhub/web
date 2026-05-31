/**
 * @deprecated Use @/lib/geserverhub-db or @/lib/mysql-ge — geserverhub only.
 */
export {
  queryGeserverhub,
  queryGeserverhub as queryGe,
  queryGeserverhub as queryKsave,
} from './geserverhub-db';

export {
  getAllDevices,
  getDeviceById,
  getDeviceByGeId,
  getDeviceByGeId as getDeviceByKsaveId,
} from './mysql-ge';
