import {
  fetchLinkedStudentsForParent,
  fetchStudentContent,
  guardPage,
  renderParentStudentBundles
} from "./portal-client";

export async function bootstrapParentPortal() {
  const { profile } = await guardPage(["parent"], {
    adminRedirectHome: "/admin",
    adminRedirectMessage: "This account uses the FlyBridge admin workspace.",
    unauthorizedMessage: "Your account is signed in, but parent-only reporting is available from the Parent Portal."
  });
  const container = document.querySelector<HTMLElement>("[data-parent-dashboard]");
  const studentCount = document.querySelector<HTMLElement>("[data-parent-student-count]");
  if (!container) return;

  const students = await fetchLinkedStudentsForParent(profile.id);
  const { reports, assessments, targets } = await fetchStudentContent(students.map((student) => student.id));
  const bundles = students.map((student) => ({
    student,
    reports: reports.filter((report) => report.student_id === student.id),
    assessments: assessments.filter((assessment) => assessment.student_id === student.id),
    targets: targets.filter((target) => target.student_id === student.id)
  }));

  if (studentCount) {
    studentCount.textContent = String(students.length);
  }

  renderParentStudentBundles(container, bundles);
}
