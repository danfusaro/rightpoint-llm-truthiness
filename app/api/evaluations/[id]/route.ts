import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationById } from '@/lib/db';

type Params = { id: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: "Evaluation ID is required" },
        { status: 400 }
      );
    }
    
    const evaluation = getEvaluationById(id);
    
    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Error retrieving evaluation:', error);
    return NextResponse.json(
      { error: "Failed to retrieve evaluation" },
      { status: 500 }
    );
  }
}
