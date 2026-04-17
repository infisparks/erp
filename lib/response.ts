export const successResponse = (data: any, message: string = "") => {
  return Response.json({ success: true, data, message });
};

export const errorResponse = (message: string, status: number = 400) => {
  return Response.json({ success: false, message }, { status });
};
