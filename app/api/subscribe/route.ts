import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailSubscription from '@/models/EmailSubscription';

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if email already exists
    const existingSubscription = await EmailSubscription.findOne({ email: email.toLowerCase() });
    if (existingSubscription) {
      return NextResponse.json({ 
        success: true, 
        message: 'You are already subscribed!',
        subscription: {
          id: existingSubscription._id.toString(),
          name: existingSubscription.name,
          email: existingSubscription.email,
          createdAt: existingSubscription.createdAt,
        },
      }, { status: 200 });
    }

    const newSubscription = await EmailSubscription.create({ 
      name: name.trim(), 
      email: email.toLowerCase().trim() 
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed! We\'ll notify you when the app launches.',
      subscription: {
        id: newSubscription._id.toString(),
        name: newSubscription.name,
        email: newSubscription.email,
        createdAt: newSubscription.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating email subscription:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json({ 
        success: true, 
        message: 'You are already subscribed!',
      }, { status: 200 });
    }
    
    return NextResponse.json({ error: error.message || 'Failed to subscribe' }, { status: 500 });
  }
}
