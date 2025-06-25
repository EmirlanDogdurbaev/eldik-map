import { createApi } from "@reduxjs/toolkit/query/react";
import { authFetchBaseQuery } from "./authFetchBaseQuery";

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: authFetchBaseQuery(),
  endpoints: (builder) => ({
    downloadDriverLoadReport: builder.query<Blob, void>({
      query: () => ({
        url: "export-driver-load-excel/",
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка ${response.status}`);
          }
          console.log("Driver report headers:", response.headers);
          return response.blob();
        },
      }),
    }),
    downloadRequestsReport: builder.query<Blob, void>({
      query: () => ({
        url: "export-requests-excel/",
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка ${response.status}`);
          }
          console.log("Requests report headers:", response.headers);
          return response.blob();
        },
      }),
    }),
    downloadUserActivityReport: builder.query<
      Blob,
      { start_date: string; end_date: string }
    >({
      query: ({ start_date, end_date }) => ({
        url: `export-user-activity-excel/?start_date=${start_date}&end_date=${end_date}`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка ${response.status}`);
          }
          console.log("User activity report headers:", response.headers);
          return response.blob();
        },
      }),
    }),
    downloadWaybillReport: builder.query<
      string,
      { from_date: string; to_date: string; car_id: number }
    >({
      query: ({ from_date, to_date, car_id }) => ({
        url: `generate-waybill/?from_date=${from_date}&to_date=${to_date}&car_id=${car_id}`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка ${response.status}`);
          }
          return response.text();
        },
      }),
    }),
    downloadRouteSheetReport: builder.query<
      string,
      {
        from_date: string;
        to_date: string;
        car_id: number;
        waybill_number: string;
        extended_to: string;
      }
    >({
      query: ({ from_date, to_date, car_id, waybill_number, extended_to }) => ({
        url: `generate-route-sheet/?from_date=${from_date}&to_date=${to_date}&car_id=${car_id}&waybill_number=${waybill_number}&extended_to=${extended_to}`,
        method: "GET",
        responseHandler: async (response) => {
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || `Ошибка ${response.status}`);
          }
          console.log("Route sheet report headers:", response.headers);
          return response.text();
        },
      }),
    }),
  }),
});

export const {
  useLazyDownloadDriverLoadReportQuery,
  useLazyDownloadRequestsReportQuery,
  useLazyDownloadUserActivityReportQuery,
  useLazyDownloadWaybillReportQuery,
  useLazyDownloadRouteSheetReportQuery,
} = reportApi;
