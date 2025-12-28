import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Contact from '@/models/Contact';
import { authenticateAdmin } from '@/lib/admin';

// PATCH /api/admin/contacts/[id] - Update contact status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updateFields: any = {};
    if (body.status !== undefined) updateFields.status = body.status;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const contactObj = contact as any;
    
    return NextResponse.json({
      message: 'Contact updated successfully',
      contact: {
        id: contactObj._id.toString(),
        name: contactObj.name,
        email: contactObj.email,
        subject: contactObj.subject,
        message: contactObj.message,
        status: contactObj.status,
        createdAt: contactObj.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Admin update contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/contacts/[id] - Delete contact
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAdmin(req);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const { id } = await params;

    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Contact deleted successfully',
    });
  } catch (error: any) {
    console.error('Admin delete contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
