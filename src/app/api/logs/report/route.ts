/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Project, Table, Log } from '@/models';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { projectKey, tableKey, data, messageType } = body;

    if (!projectKey || !tableKey || !data || !messageType) {
      return errorResponse('Missing required fields', 400);
    }

    // 1. Find Project
    const project = await Project.findOne({ key: projectKey });
    if (!project) {
      return errorResponse('Invalid Project Key', 400);
    }
    if (project.status === 'banned') {
      return errorResponse('Project is banned', 403);
    }

    // 2. Find Table
    const table = await Table.findOne({ project: project._id, key: tableKey });
    if (!table) {
      return errorResponse('Invalid Table Key', 400);
    }

    // 3. Validate Message Type
    const isValidMessageType = table.messageTypes.some(mt => mt.key === messageType);
    if (!isValidMessageType) {
      return errorResponse(`Invalid messageType: ${messageType}`, 400);
    }

    // 4. Fill Default Values & Create Log
    const logData = { ...data };
    
    // Fill in defaults if missing
    if (table.columns && Array.isArray(table.columns)) {
      table.columns.forEach(col => {
        if (col.defaultValue !== undefined && (logData[col.key] === undefined || logData[col.key] === null)) {
          logData[col.key] = col.defaultValue;
        }
      });
    }

    const log = await Log.create({
      project: project._id,
      table: table._id,
      data: logData,
      messageType
    });

    return successResponse(log, 'Log reported successfully');
  } catch (error: any) {
    console.error('Report Log Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

