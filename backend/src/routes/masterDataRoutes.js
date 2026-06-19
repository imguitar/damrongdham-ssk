'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const masterDataController = require('../controllers/masterDataController');

const ADMIN_ROLES = ['super_admin', 'admin'];
const STAFF_ROLES = ['super_admin', 'admin', 'officer', 'agency_head', 'agency_officer'];

router.use(authenticate);

// --- Complaint Categories ---
router.get('/categories', authorize(...STAFF_ROLES), masterDataController.listCategories);
router.post('/categories', authorize(...ADMIN_ROLES), masterDataController.createCategory);
router.put('/categories/:id', authorize(...ADMIN_ROLES), masterDataController.updateCategory);
router.patch('/categories/:id/toggle', authorize(...ADMIN_ROLES), masterDataController.toggleCategoryStatus);

// --- Complaint Channels ---
router.get('/channels', authorize(...STAFF_ROLES), masterDataController.listChannels);
router.post('/channels', authorize(...ADMIN_ROLES), masterDataController.createChannel);
router.put('/channels/:id', authorize(...ADMIN_ROLES), masterDataController.updateChannel);
router.patch('/channels/:id/toggle', authorize(...ADMIN_ROLES), masterDataController.toggleChannelStatus);

// --- Service Types ---
router.get('/service-types', authorize(...STAFF_ROLES), masterDataController.listServiceTypes);
router.post('/service-types', authorize(...ADMIN_ROLES), masterDataController.createServiceType);
router.put('/service-types/:id', authorize(...ADMIN_ROLES), masterDataController.updateServiceType);
router.patch('/service-types/:id/toggle', authorize(...ADMIN_ROLES), masterDataController.toggleServiceTypeStatus);

// --- Complaint Natures ---
router.get('/complaint-natures', authorize(...STAFF_ROLES), masterDataController.listComplaintNatures);
router.post('/complaint-natures', authorize(...ADMIN_ROLES), masterDataController.createComplaintNature);
router.put('/complaint-natures/:id', authorize(...ADMIN_ROLES), masterDataController.updateComplaintNature);
router.patch('/complaint-natures/:id/toggle', authorize(...ADMIN_ROLES), masterDataController.toggleComplaintNatureStatus);

// --- Complainant Types ---
router.get('/complainant-types', authorize(...STAFF_ROLES), masterDataController.listComplainantTypes);
router.post('/complainant-types', authorize(...ADMIN_ROLES), masterDataController.createComplainantType);
router.put('/complainant-types/:id', authorize(...ADMIN_ROLES), masterDataController.updateComplainantType);
router.patch('/complainant-types/:id/toggle', authorize(...ADMIN_ROLES), masterDataController.toggleComplainantTypeStatus);

// --- Provinces (read-only for staff) ---
router.get('/provinces', authorize(...STAFF_ROLES), masterDataController.listProvinces);

// --- Districts (read-only for staff) ---
router.get('/districts', authorize(...STAFF_ROLES), masterDataController.listDistricts);
router.get('/districts/by-province/:province_id', authorize(...STAFF_ROLES), masterDataController.listDistrictsByProvince);

// --- Subdistricts (read-only for staff) ---
router.get('/subdistricts/by-district/:district_id', authorize(...STAFF_ROLES), masterDataController.listSubdistrictsByDistrict);

module.exports = router;
