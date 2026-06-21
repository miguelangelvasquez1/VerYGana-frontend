"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import TicketRulesManagement from "@/components/Admin/ticket-rules/TicketRulesManagement";

export default function TicketRulesPage() {
  return (
    <AdminLayout>
        <TicketRulesManagement/>
    </AdminLayout>
  );
}
