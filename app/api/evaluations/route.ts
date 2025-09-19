import { NextResponse } from 'next/server';
import { getAllEvaluations } from '@/lib/db';

export async function GET() {
  try {
    const evaluations = getAllEvaluations();
    
    // Sort evaluations by timestamp (newest first)
    evaluations.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error('Error retrieving evaluations:', error);
    return NextResponse.json(
      { error: "Failed to retrieve evaluations" },
      { status: 500 }
    );
  }
}
