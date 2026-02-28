/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project } from '@/models';
import { successResponse, errorResponse } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return errorResponse('Project name is required', 400);
    }

    const key = uuidv4();
    const project = await Project.create({ name, key });

    return successResponse(project, 'Project created successfully');
  } catch (error: any) {
    console.error('Create Project Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return successResponse(projects);
  } catch (error: any) {
    console.error('List Projects Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

