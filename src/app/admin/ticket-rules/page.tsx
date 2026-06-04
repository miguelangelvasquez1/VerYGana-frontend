"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import TicketRulesManagement from "@/components/admin/ticket-rules/TicketRulesManagement";

export default function TicketRulesPage() {
  return (
    <AdminLayout>
        <TicketRulesManagement/>
    </AdminLayout>
  );
}
