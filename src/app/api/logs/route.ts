/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Log } from '@/models';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const tableId = searchParams.get('tableId');
    const logId = searchParams.get('logId');
    const messageType = searchParams.get('messageType');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    const query: any = {};

    if (projectId) query.project = projectId;
    if (tableId) query.table = tableId;
    if (logId) query._id = logId;
    if (messageType) query.messageType = messageType;

    if (startTime || endTime) {
      query.createdAt = {};
      if (startTime) query.createdAt.$gte = new Date(startTime);
      if (endTime) query.createdAt.$lte = new Date(endTime);
    }

    // Limit results to avoid overload
    const limit = 100;

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('project', 'name key')
      .populate('table', 'key label columns');

    return successResponse(logs);
  } catch (error: any) {
    console.error('Search Logs Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

