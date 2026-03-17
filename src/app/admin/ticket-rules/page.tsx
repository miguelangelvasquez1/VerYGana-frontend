"use client";

import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import TicketRulesManagement from "@/components/admin/ticket-rules/ticketRulesManagement";

export default function TicketRulesPage() {
  return (
    <AdminLayout>
        <TicketRulesManagement/>
    </AdminLayout>
  );
}
