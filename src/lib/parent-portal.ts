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
  const studentCount = document.querySelector<HTMLElement>("[data-parent-student-count]");
  const list = document.querySelector<HTMLElement>("[data-parent-student-list]");
  const overview = document.querySelector<HTMLElement>("[data-parent-overview]");
  const latestLesson = document.querySelector<HTMLElement>("[data-parent-latest-lesson]");
  const homework = document.querySelector<HTMLElement>("[data-parent-homework]");
  const assessmentsContainer = document.querySelector<HTMLElement>("[data-parent-assessments]");
  const history = document.querySelector<HTMLElement>("[data-parent-history]");
  if (!list || !overview || !latestLesson || !homework || !assessmentsContainer || !history) return;

  const students = await fetchLinkedStudentsForParent(profile.id);
  const { lessons, reports, assessments, targets } = await fetchStudentContent(students.map((student) => student.id));
  const bundles = students.map((student) => ({
    student,
    lessons: lessons.filter((lesson) => lesson.student_id === student.id),
    reports: reports.filter((report) => report.student_id === student.id),
    assessments: assessments.filter((assessment) => assessment.student_id === student.id),
    targets: targets.filter((target) => target.student_id === student.id)
  }));

  if (studentCount) {
    studentCount.textContent = `${students.length} linked`;
  }

  renderParentStudentBundles(
    {
      list,
      overview,
      latestLesson,
      homework,
      assessments: assessmentsContainer,
      history
    },
    bundles
  );

  document.querySelectorAll<HTMLDetailsElement>("[data-parent-faq]").forEach((faq) => {
    faq.addEventListener("toggle", () => {
      if (!faq.open) return;
      document.querySelectorAll<HTMLDetailsElement>("[data-parent-faq]").forEach((other) => {
        if (other !== faq) other.open = false;
      });
    });
  });
}
