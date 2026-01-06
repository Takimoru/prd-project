# Registration Page Migration: Complete

**Date:** 2024  
**Status:** ✅ **Migration Complete**

---

## ✅ What Was Changed

### 1. Replaced Convex Hooks with Apollo Client

**Before:**
```typescript
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const programs = useQuery(api.programs.getAllPrograms, { includeArchived: false });
const generateUploadUrl = useMutation(api.registrations.generatePaymentUploadUrl);
const submitRegistration = useMutation(api.registrations.submitRegistration);
```

**After:**
```typescript
import { useMutation, useQuery } from "@apollo/client";
import { GET_PROGRAMS } from "@/graphql/admin";
import { SUBMIT_REGISTRATION } from "@/graphql/registration";

const { data: programsData, loading: programsLoading } = useQuery(GET_PROGRAMS, {
  variables: { includeArchived: false },
});
const [submitRegistrationMutation] = useMutation(SUBMIT_REGISTRATION);
```

---

### 2. Replaced Convex File Upload with Backend Upload Endpoint

**Before:**
```typescript
const uploadUrl = await generateUploadUrl();
const uploadResponse = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": formData.paymentFile.type },
  body: formData.paymentFile,
});
const { storageId } = await uploadResponse.json();
```

**After:**
```typescript
const formDataToUpload = new FormData();
formDataToUpload.append("file", formData.paymentFile);
formDataToUpload.append("targetType", "registration");
formDataToUpload.append("targetId", formData.programId);

const uploadResponse = await fetch("http://localhost:4000/api/upload/single", {
  method: "POST",
  body: formDataToUpload,
});

const uploadResult = await uploadResponse.json();
const paymentProofUrl = uploadResult.url.startsWith('http') 
  ? uploadResult.url 
  : `http://localhost:4000${uploadResult.url}`;
```

---

### 3. Updated Registration Submission

**Before:**
```typescript
await submitRegistration({
  programId: formData.programId as any,
  fullName: formData.fullName.trim(),
  studentId: formData.studentId.trim(),
  phone: formData.phone.trim(),
  email: formData.email.trim().toLowerCase(),
  paymentProofStorageId: storageId,
});
```

**After:**
```typescript
await submitRegistrationMutation({
  variables: {
    input: {
      programId: formData.programId,
      fullName: formData.fullName.trim(),
      studentId: formData.studentId.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      paymentProofUrl: paymentProofUrl,
    },
  },
});
```

---

### 4. Updated Program List Rendering

**Before:**
```typescript
{programs?.map((program) => (
  <option key={program._id} value={program._id}>
    {program.title}
  </option>
))}
```

**After:**
```typescript
{programsLoading ? (
  <option value="">Loading programs...</option>
) : (
  programs.map((program: any) => (
    <option key={program.id} value={program.id}>
      {program.title}
    </option>
  ))
)}
```

---

## 📁 Files Modified

1. **`packages/client/src/pages/RegistrationPage.tsx`**
   - Replaced all Convex hooks with Apollo Client
   - Updated file upload to use backend endpoint
   - Updated data structure (`.id` instead of `._id`)

2. **`packages/client/src/graphql/registration.ts`** (NEW)
   - Created GraphQL mutation for registration submission

---

## 🔧 Backend Requirements

The migration assumes:
- ✅ Backend upload endpoint at `http://localhost:4000/api/upload/single`
- ✅ GraphQL mutation `submitRegistration` exists in resolver
- ✅ GraphQL query `programs` exists in resolver
- ✅ Apollo Client configured in `packages/client/src/lib/apollo.ts`

---

## ✅ Testing Checklist

- [ ] Registration page loads without Convex errors
- [ ] Programs list loads correctly
- [ ] File upload works (payment proof)
- [ ] Registration submission succeeds
- [ ] Success message displays
- [ ] Error handling works

---

## 🎯 Migration Status

**Registration Page:** ✅ **COMPLETE** - No longer uses Convex

The page now uses:
- Apollo Client for GraphQL queries/mutations
- Backend file upload endpoint
- GraphQL schema for type safety

---

**Ready for testing!**



