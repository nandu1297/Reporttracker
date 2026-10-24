import test from "node:test";
import assert from "node:assert/strict";
import { summarize, employeeTotal, clientTotal } from "./calc";

test("employee total = rate x quantity", () => {
  assert.equal(employeeTotal(400, 3), 1200);
  assert.equal(employeeTotal(500, 2), 1000);
});

test("spec example", () => {
  const rows = [
    { reportsReceived: 2, clientTotal: clientTotal(2, 2000), employeeId: "a", employeeTotal: employeeTotal(400, 2), clientPaid: 4000, employeePaid: 0 },
    { reportsReceived: 1, clientTotal: 2000, employeeId: "b", employeeTotal: 400, clientPaid: 0, employeePaid: 400 },
    { reportsReceived: 1, clientTotal: 2000, employeeId: null, employeeTotal: 400, clientPaid: 0, employeePaid: 0 },
  ];
  const s = summarize(rows);
  assert.equal(s.reportsReceived, 4);
  assert.equal(s.reportsAssigned, 3);
  assert.equal(s.reportsPending, 1);
  assert.equal(s.clientAmount, 8000);
  assert.equal(s.clientReceived, 4000);
  assert.equal(s.clientPending, 4000);
  assert.equal(s.employeeTotal, 1600);
  assert.equal(s.employeePaid, 400);
  assert.equal(s.employeePending, 1200);
  assert.equal(s.profit, 6400);
});
