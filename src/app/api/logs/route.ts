/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Log } from '@/models';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getAuthenticatedUser } from '@/lib/auth-server';

export async function GET(req: NextRequest) {
  try {
    if (!await getAuthenticatedUser(req)) return errorResponse('UNAUTHENTICATED', 401);
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const tableId = searchParams.get('tableId');
    const logId = searchParams.get('logId');
    const messageType = searchParams.get('messageType');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

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

    // 每页固定最多返回 50 条，避免日志列表一次性加载过多数据。
    const pageSize = 50;
    const total = await Log.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(page, totalPages);

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .populate('project', 'name key')
      .populate('table', 'key label columns');

    return successResponse({
      logs,
      pagination: { page: currentPage, pageSize, total, totalPages },
    });
  } catch (error: any) {
    console.error('Search Logs Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

