import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const project = await Project.findById(id);

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    return successResponse(project);
  } catch (error: any) {
    console.error('Get Project Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status, name } = body;

    if (status && !['active', 'banned'].includes(status)) {
      return errorResponse('Invalid status', 400);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    return successResponse(project, 'Project updated successfully');
  } catch (error: any) {
    console.error('Update Project Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}
