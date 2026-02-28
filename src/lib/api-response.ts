/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { NextResponse } from 'next/server';

export function successResponse(data: any = {}, msg: string = 'Success') {
  return NextResponse.json({ code: 200, msg, data });
}

export function errorResponse(msg: string = 'Error', code: number = 400) {
  return NextResponse.json({ code, msg, data: {} }, { status: code }); // Still return 200 OK status code or the error code? 
  // User said "If client error code 400, server error code 500". 
  // Usually the HTTP status code should match, but the JSON body also contains the code.
}

