import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Table, Project } from '@/models';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id: projectId } = await params;
    const body = await req.json();
    const { key, label, messageTypes, columns } = body;

    if (!key || !label || !messageTypes || !Array.isArray(messageTypes)) {
      return errorResponse('Missing required fields: key, label, messageTypes', 400);
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return errorResponse('Project not found', 404);
    }

    // Check if table key exists in project
    const existingTable = await Table.findOne({ project: projectId, key });
    if (existingTable) {
      return errorResponse('Table key already exists in this project', 400);
    }

    const table = await Table.create({
      project: projectId,
      key,
      label,
      messageTypes,
      columns: columns || []
    });

    return successResponse(table, 'Table created successfully');
  } catch (error: any) {
    console.error('Create Table Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id: projectId } = await params;

    const tables = await Table.find({ project: projectId }).sort({ createdAt: -1 });
    return successResponse(tables);
  } catch (error: any) {
    console.error('List Tables Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
