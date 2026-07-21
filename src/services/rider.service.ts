import ExcelJS from "exceljs";
import { FilterQuery } from "mongoose";
import { Rider, RiderDocument } from "../models/Rider.js";
import { maskAadhaar } from "../utils/mask.js";
import { toCsv } from "../utils/csv.js";
import { escapeRegex } from "../utils/regex.js";

export type ListOptions = {
  page: number;
  limit: number;
  search?: string;
  status?: "pending" | "approved" | "rejected";
  city?: string;
  state?: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export function buildRiderFilter(options: ListOptions) {
  const filter: FilterQuery<RiderDocument> = {};
  if (options.status) filter.status = options.status;
  if (options.city) filter.city = new RegExp(escapeRegex(options.city), "i");
  if (options.state) filter.state = new RegExp(escapeRegex(options.state), "i");
  if (options.search) {
    const rx = new RegExp(escapeRegex(options.search), "i");
    filter.$or = [{ fullName: rx }, { email: rx }, { phone: rx }, { dlNumber: rx }, { bikeNumber: rx }];
  }
  return filter;
}

export async function listRiders(options: ListOptions) {
  const filter = buildRiderFilter(options);
  const skip = (options.page - 1) * options.limit;
  const sort: Record<string, 1 | -1> = { [options.sortBy]: options.sortOrder === "asc" ? 1 : -1 };
  const [riders, total] = await Promise.all([
    Rider.find(filter).sort(sort).skip(skip).limit(options.limit).lean(),
    Rider.countDocuments(filter)
  ]);

  return {
    riders: riders.map((rider) => {
      const { aadhaarFront, aadhaarBack, dlFront, dlBack, ...safeRider } = rider;
      return {
        ...safeRider,
        aadhaarNumber: maskAadhaar(rider.aadhaarNumber),
        aadhaarFront: { available: Boolean(aadhaarFront), kind: aadhaarFront?.url.toLowerCase().includes(".pdf") ? "pdf" : "image" },
        aadhaarBack: { available: Boolean(aadhaarBack), kind: aadhaarBack?.url.toLowerCase().includes(".pdf") ? "pdf" : "image" },
        dlFront: { available: Boolean(dlFront), kind: dlFront?.url.toLowerCase().includes(".pdf") ? "pdf" : "image" },
        dlBack: { available: Boolean(dlBack), kind: dlBack?.url.toLowerCase().includes(".pdf") ? "pdf" : "image" }
      };
    }),
    meta: { page: options.page, limit: options.limit, total, totalPages: Math.ceil(total / options.limit) }
  };
}

export async function dashboardStats() {
  const [total, pending, approved, rejected] = await Promise.all([
    Rider.countDocuments(),
    Rider.countDocuments({ status: "pending" }),
    Rider.countDocuments({ status: "approved" }),
    Rider.countDocuments({ status: "rejected" })
  ]);
  return { total, pending, approved, rejected };
}

export async function exportRidersCsv() {
  const riders = await Rider.find().sort({ createdAt: -1 }).lean();
  return toCsv(
    riders.map((rider) => ({
      name: rider.fullName,
      email: rider.email,
      phone: rider.phone,
      city: rider.city,
      state: rider.state,
      bikeNumber: rider.bikeNumber,
      status: rider.status,
      aadhaar: maskAadhaar(rider.aadhaarNumber),
      createdAt: rider.createdAt
    }))
  );
}

export async function exportRidersExcel() {
  const riders = await Rider.find().sort({ createdAt: -1 }).lean();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Riders");
  sheet.columns = [
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Phone", key: "phone", width: 16 },
    { header: "City", key: "city", width: 18 },
    { header: "State", key: "state", width: 18 },
    { header: "Bike Number", key: "bikeNumber", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Aadhaar", key: "aadhaar", width: 18 },
    { header: "Created At", key: "createdAt", width: 24 }
  ];
  riders.forEach((rider) =>
    sheet.addRow({
      name: rider.fullName,
      email: rider.email,
      phone: rider.phone,
      city: rider.city,
      state: rider.state,
      bikeNumber: rider.bikeNumber,
      status: rider.status,
      aadhaar: maskAadhaar(rider.aadhaarNumber),
      createdAt: rider.createdAt
    })
  );
  return workbook.xlsx.writeBuffer();
}
