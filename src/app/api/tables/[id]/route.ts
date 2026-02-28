import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Table } from '@/models';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const table = await Table.findById(id);

    if (!table) {
      return errorResponse('Table not found', 404);
    }

    return successResponse(table);
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { label, messageTypes, columns } = body;

    if (!label || !messageTypes || !Array.isArray(messageTypes)) {
      return errorResponse('Missing required fields', 400);
    }

    const table = await Table.findByIdAndUpdate(
      id,
      { label, messageTypes, columns: columns || [] },
      { new: true }
    );

    if (!table) {
      return errorResponse('Table not found', 404);
    }

    return successResponse(table, 'Table updated successfully');
  } catch (error: any) {
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
