'use client';

import React from 'react';

export default function PetCatalogEditor() {
  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <iframe
        src="https://assets-abokamato.s3.us-east-2.amazonaws.com/PetVirtual/S3AdminPortal/index.html"
        className="flex-1 w-full border-none rounded-lg"
        title="Pet Catalog Editor"
      />
    </div>
  );
}