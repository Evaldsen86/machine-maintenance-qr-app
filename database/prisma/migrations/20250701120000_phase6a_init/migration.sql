-- Enable UUID generation (required for gen_random_uuid() defaults)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'invited', 'disabled');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'ready_for_repair', 'awaiting_parts', 'in_progress', 'completed', 'canceled', 'approved', 'invoiced');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('active', 'inactive', 'maintenance', 'repair', 'retired');

-- CreateEnum
CREATE TYPE "DocumentAccessLevel" AS ENUM ('private', 'restricted', 'company', 'public');

-- CreateEnum
CREATE TYPE "QRCodeStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced');

-- CreateEnum
CREATE TYPE "InventoryPartStatus" AS ENUM ('active', 'low_stock', 'out_of_stock', 'archived');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'restore', 'login', 'logout', 'upload', 'download', 'status_change', 'assign', 'unassign', 'submit', 'approve', 'reject', 'export', 'archive');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('draft', 'active', 'submitted', 'approved', 'rejected', 'correction_requested', 'exported_to_payroll', 'invoiced', 'archived');

-- CreateEnum
CREATE TYPE "TimeEntrySource" AS ENUM ('timer', 'manual');

-- CreateEnum
CREATE TYPE "PayrollExportStatus" AS ENUM ('draft', 'finalized', 'sent');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'sent', 'paid', 'void');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "registration_no" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "address_line_1" TEXT,
    "address_line_2" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "timezone" TEXT DEFAULT 'UTC',
    "status" "CompanyStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "is_company_admin" BOOLEAN NOT NULL DEFAULT false,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "brand" TEXT,
    "serial_number" TEXT NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'active',
    "description" TEXT,
    "location_name" TEXT,
    "location_address" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "specifications" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "uploaded_by_user_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "file_size_bytes" BIGINT,
    "access_level" "DocumentAccessLevel" NOT NULL DEFAULT 'restricted',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "machine_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "qr_token" TEXT NOT NULL,
    "public_slug" TEXT,
    "payload_hash" TEXT,
    "status" "QRCodeStatus" NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "last_scanned_at" TIMESTAMP(3),
    "last_scanned_by_ip" TEXT,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "due_date" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "estimated_hours" DECIMAL(8,2),
    "actual_hours" DECIMAL(8,2),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "task_id" UUID,
    "recorded_by_user_id" UUID,
    "maintenance_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "technician_name" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "task_id" UUID,
    "recorded_by_user_id" UUID,
    "service_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" TEXT,
    "issues_found" TEXT,
    "odometer_reading" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oil_information" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "oil_type" TEXT NOT NULL,
    "viscosity" TEXT,
    "quantity" DECIMAL(10,2),
    "quantity_unit" TEXT DEFAULT 'L',
    "last_changed_at" TIMESTAMP(3),
    "next_change_due_at" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "oil_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_parts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "part_number" TEXT,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT DEFAULT 'pcs',
    "quantity_in_stock" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "minimum_stock_level" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "location_name" TEXT,
    "status" "InventoryPartStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "machine_id" UUID,
    "created_by_user_id" UUID,
    "offer_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'DKK',
    "status" "OfferStatus" NOT NULL DEFAULT 'draft',
    "valid_until" TIMESTAMP(3),
    "subtotal_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "offer_id" UUID NOT NULL,
    "inventory_part_id" UUID,
    "line_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offer_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "target_user_id" UUID,
    "machine_id" UUID,
    "task_id" UUID,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "external_ref" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "machine_id" UUID,
    "task_id" UUID,
    "customer_id" UUID,
    "offer_id" UUID,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "break_minutes" INTEGER NOT NULL DEFAULT 0,
    "billable_minutes" INTEGER NOT NULL DEFAULT 0,
    "non_billable_minutes" INTEGER NOT NULL DEFAULT 0,
    "hourly_rate_internal" DECIMAL(12,2),
    "hourly_rate_customer" DECIMAL(12,2),
    "description" TEXT NOT NULL DEFAULT '',
    "technician_notes" TEXT,
    "leader_notes" TEXT,
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'draft',
    "source" "TimeEntrySource" NOT NULL DEFAULT 'timer',
    "equipment_type" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_by_user_id" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_by_user_id" UUID,
    "rejected_at" TIMESTAMP(3),
    "payroll_export_id" UUID,
    "invoice_id" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entry_parts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "time_entry_id" UUID NOT NULL,
    "inventory_part_id" UUID,
    "name" TEXT NOT NULL,
    "part_number" TEXT,
    "quantity" DECIMAL(14,3) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "time_entry_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_exports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "status" "PayrollExportStatus" NOT NULL DEFAULT 'draft',
    "exported_by_user_id" UUID NOT NULL,
    "exported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "file_path" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payroll_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_export_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "payroll_export_id" UUID NOT NULL,
    "time_entry_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "minutes" INTEGER NOT NULL,
    "hourly_rate" DECIMAL(12,2) NOT NULL,
    "line_amount" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_export_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "created_by_user_id" UUID,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "currency" TEXT NOT NULL DEFAULT 'DKK',
    "subtotal_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_time_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "time_entry_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "hourly_rate" DECIMAL(12,2) NOT NULL,
    "line_total" DECIMAL(14,2) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoice_time_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- CreateIndex
CREATE INDEX "users_company_id_status_idx" ON "users"("company_id", "status");

-- CreateIndex
CREATE INDEX "users_company_id_deleted_at_idx" ON "users"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "users"("company_id", "email");

-- CreateIndex
CREATE INDEX "roles_company_id_deleted_at_idx" ON "roles"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_company_id_code_key" ON "roles"("company_id", "code");

-- CreateIndex
CREATE INDEX "permissions_company_id_deleted_at_idx" ON "permissions"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_company_id_code_key" ON "permissions"("company_id", "code");

-- CreateIndex
CREATE INDEX "user_roles_company_id_user_id_idx" ON "user_roles"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "user_roles_company_id_role_id_idx" ON "user_roles"("company_id", "role_id");

-- CreateIndex
CREATE INDEX "user_roles_company_id_permission_id_idx" ON "user_roles"("company_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_company_id_user_id_role_id_permission_id_key" ON "user_roles"("company_id", "user_id", "role_id", "permission_id");

-- CreateIndex
CREATE INDEX "machines_company_id_status_idx" ON "machines"("company_id", "status");

-- CreateIndex
CREATE INDEX "machines_company_id_deleted_at_idx" ON "machines"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "machines_company_id_name_idx" ON "machines"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "machines_company_id_serial_number_key" ON "machines"("company_id", "serial_number");

-- CreateIndex
CREATE INDEX "machine_documents_company_id_machine_id_idx" ON "machine_documents"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "machine_documents_company_id_access_level_idx" ON "machine_documents"("company_id", "access_level");

-- CreateIndex
CREATE INDEX "machine_documents_company_id_deleted_at_idx" ON "machine_documents"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "qr_codes_company_id_machine_id_idx" ON "qr_codes"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "qr_codes_company_id_status_idx" ON "qr_codes"("company_id", "status");

-- CreateIndex
CREATE INDEX "qr_codes_company_id_payload_hash_idx" ON "qr_codes"("company_id", "payload_hash");

-- CreateIndex
CREATE INDEX "qr_codes_company_id_deleted_at_idx" ON "qr_codes"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_company_id_qr_token_key" ON "qr_codes"("company_id", "qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "qr_codes_company_id_public_slug_key" ON "qr_codes"("company_id", "public_slug");

-- CreateIndex
CREATE INDEX "tasks_company_id_machine_id_idx" ON "tasks"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "tasks_company_id_status_idx" ON "tasks"("company_id", "status");

-- CreateIndex
CREATE INDEX "tasks_company_id_priority_idx" ON "tasks"("company_id", "priority");

-- CreateIndex
CREATE INDEX "tasks_company_id_due_date_idx" ON "tasks"("company_id", "due_date");

-- CreateIndex
CREATE INDEX "tasks_company_id_deleted_at_idx" ON "tasks"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "task_assignees_company_id_user_id_idx" ON "task_assignees"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "task_assignees_company_id_task_id_idx" ON "task_assignees"("company_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignees_company_id_task_id_user_id_key" ON "task_assignees"("company_id", "task_id", "user_id");

-- CreateIndex
CREATE INDEX "maintenance_records_company_id_machine_id_idx" ON "maintenance_records"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "maintenance_records_company_id_maintenance_date_idx" ON "maintenance_records"("company_id", "maintenance_date");

-- CreateIndex
CREATE INDEX "maintenance_records_company_id_deleted_at_idx" ON "maintenance_records"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "service_records_company_id_machine_id_idx" ON "service_records"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "service_records_company_id_service_date_idx" ON "service_records"("company_id", "service_date");

-- CreateIndex
CREATE INDEX "service_records_company_id_deleted_at_idx" ON "service_records"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "oil_information_company_id_machine_id_idx" ON "oil_information"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "oil_information_company_id_next_change_due_at_idx" ON "oil_information"("company_id", "next_change_due_at");

-- CreateIndex
CREATE INDEX "oil_information_company_id_deleted_at_idx" ON "oil_information"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "inventory_parts_company_id_part_number_idx" ON "inventory_parts"("company_id", "part_number");

-- CreateIndex
CREATE INDEX "inventory_parts_company_id_status_idx" ON "inventory_parts"("company_id", "status");

-- CreateIndex
CREATE INDEX "inventory_parts_company_id_deleted_at_idx" ON "inventory_parts"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_parts_company_id_sku_key" ON "inventory_parts"("company_id", "sku");

-- CreateIndex
CREATE INDEX "offers_company_id_status_idx" ON "offers"("company_id", "status");

-- CreateIndex
CREATE INDEX "offers_company_id_machine_id_idx" ON "offers"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "offers_company_id_deleted_at_idx" ON "offers"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "offers_company_id_offer_number_key" ON "offers"("company_id", "offer_number");

-- CreateIndex
CREATE INDEX "offer_lines_company_id_offer_id_idx" ON "offer_lines"("company_id", "offer_id");

-- CreateIndex
CREATE INDEX "offer_lines_company_id_inventory_part_id_idx" ON "offer_lines"("company_id", "inventory_part_id");

-- CreateIndex
CREATE INDEX "offer_lines_company_id_deleted_at_idx" ON "offer_lines"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "offer_lines_company_id_offer_id_line_number_key" ON "offer_lines"("company_id", "offer_id", "line_number");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_action_idx" ON "audit_logs"("company_id", "action");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_entity_type_entity_id_idx" ON "audit_logs"("company_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_machine_id_idx" ON "audit_logs"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_task_id_idx" ON "audit_logs"("company_id", "task_id");

-- CreateIndex
CREATE INDEX "customers_company_id_status_idx" ON "customers"("company_id", "status");

-- CreateIndex
CREATE INDEX "customers_company_id_deleted_at_idx" ON "customers"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customers_company_id_name_idx" ON "customers"("company_id", "name");

-- CreateIndex
CREATE INDEX "time_entries_company_id_status_idx" ON "time_entries"("company_id", "status");

-- CreateIndex
CREATE INDEX "time_entries_company_id_user_id_status_idx" ON "time_entries"("company_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "time_entries_company_id_task_id_idx" ON "time_entries"("company_id", "task_id");

-- CreateIndex
CREATE INDEX "time_entries_company_id_machine_id_idx" ON "time_entries"("company_id", "machine_id");

-- CreateIndex
CREATE INDEX "time_entries_company_id_submitted_at_idx" ON "time_entries"("company_id", "submitted_at");

-- CreateIndex
CREATE INDEX "time_entries_company_id_payroll_export_id_idx" ON "time_entries"("company_id", "payroll_export_id");

-- CreateIndex
CREATE INDEX "time_entries_company_id_invoice_id_idx" ON "time_entries"("company_id", "invoice_id");

-- CreateIndex
CREATE INDEX "time_entries_company_id_deleted_at_idx" ON "time_entries"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "time_entry_parts_company_id_time_entry_id_idx" ON "time_entry_parts"("company_id", "time_entry_id");

-- CreateIndex
CREATE INDEX "time_entry_parts_company_id_inventory_part_id_idx" ON "time_entry_parts"("company_id", "inventory_part_id");

-- CreateIndex
CREATE INDEX "time_entry_parts_company_id_deleted_at_idx" ON "time_entry_parts"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "payroll_exports_company_id_period_start_period_end_idx" ON "payroll_exports"("company_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "payroll_exports_company_id_status_idx" ON "payroll_exports"("company_id", "status");

-- CreateIndex
CREATE INDEX "payroll_exports_company_id_deleted_at_idx" ON "payroll_exports"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "payroll_export_lines_company_id_payroll_export_id_idx" ON "payroll_export_lines"("company_id", "payroll_export_id");

-- CreateIndex
CREATE INDEX "payroll_export_lines_company_id_time_entry_id_idx" ON "payroll_export_lines"("company_id", "time_entry_id");

-- CreateIndex
CREATE INDEX "payroll_export_lines_company_id_user_id_idx" ON "payroll_export_lines"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_export_lines_payroll_export_id_time_entry_id_key" ON "payroll_export_lines"("payroll_export_id", "time_entry_id");

-- CreateIndex
CREATE INDEX "invoices_company_id_customer_id_idx" ON "invoices"("company_id", "customer_id");

-- CreateIndex
CREATE INDEX "invoices_company_id_status_idx" ON "invoices"("company_id", "status");

-- CreateIndex
CREATE INDEX "invoices_company_id_deleted_at_idx" ON "invoices"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_company_id_invoice_number_key" ON "invoices"("company_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_time_lines_company_id_invoice_id_idx" ON "invoice_time_lines"("company_id", "invoice_id");

-- CreateIndex
CREATE INDEX "invoice_time_lines_company_id_time_entry_id_idx" ON "invoice_time_lines"("company_id", "time_entry_id");

-- CreateIndex
CREATE INDEX "invoice_time_lines_company_id_deleted_at_idx" ON "invoice_time_lines"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_time_lines_invoice_id_time_entry_id_key" ON "invoice_time_lines"("invoice_id", "time_entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_time_lines_company_id_invoice_id_line_number_key" ON "invoice_time_lines"("company_id", "invoice_id", "line_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_documents" ADD CONSTRAINT "machine_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_documents" ADD CONSTRAINT "machine_documents_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_documents" ADD CONSTRAINT "machine_documents_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_information" ADD CONSTRAINT "oil_information_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oil_information" ADD CONSTRAINT "oil_information_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_parts" ADD CONSTRAINT "inventory_parts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_lines" ADD CONSTRAINT "offer_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_lines" ADD CONSTRAINT "offer_lines_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_lines" ADD CONSTRAINT "offer_lines_inventory_part_id_fkey" FOREIGN KEY ("inventory_part_id") REFERENCES "inventory_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_rejected_by_user_id_fkey" FOREIGN KEY ("rejected_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_payroll_export_id_fkey" FOREIGN KEY ("payroll_export_id") REFERENCES "payroll_exports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry_parts" ADD CONSTRAINT "time_entry_parts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry_parts" ADD CONSTRAINT "time_entry_parts_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entry_parts" ADD CONSTRAINT "time_entry_parts_inventory_part_id_fkey" FOREIGN KEY ("inventory_part_id") REFERENCES "inventory_parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_exports" ADD CONSTRAINT "payroll_exports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_exports" ADD CONSTRAINT "payroll_exports_exported_by_user_id_fkey" FOREIGN KEY ("exported_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_export_lines" ADD CONSTRAINT "payroll_export_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_export_lines" ADD CONSTRAINT "payroll_export_lines_payroll_export_id_fkey" FOREIGN KEY ("payroll_export_id") REFERENCES "payroll_exports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_export_lines" ADD CONSTRAINT "payroll_export_lines_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_time_lines" ADD CONSTRAINT "invoice_time_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_time_lines" ADD CONSTRAINT "invoice_time_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_time_lines" ADD CONSTRAINT "invoice_time_lines_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

