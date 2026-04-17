import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClinic, getAllClinics, getClinicUsers, getUserClinics } from '@/lib/multi-tenant';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    // Only admins can create clinics
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await req.json();

    const clinic = createClinic({
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country || 'ES',
      licenseNumber: data.licenseNumber || '',
      veterinarian: data.veterinarian || '',
      status: 'ACTIVE',
      plan: data.plan || 'STARTER',
    });

    return NextResponse.json(clinic);
  } catch (error) {
    console.error('Clinic creation failed:', error);
    return NextResponse.json(
      { error: 'Clinic creation failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admins see all clinics
    if (session.user.role === 'ADMIN') {
      const clinics = getAllClinics();
      return NextResponse.json(clinics);
    }

    // Other users see only their clinics
    const userClinics = getUserClinics(session.user.id);
    return NextResponse.json(userClinics);
  } catch (error) {
    console.error('Failed to fetch clinics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clinics' },
      { status: 500 }
    );
  }
}
