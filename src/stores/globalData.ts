import { getCourses } from "@/apiConnections/courses";
import { getStudents } from "@/apiConnections/students";
import type { Course } from "@/types/courseTypes";
import type { Student } from "@/types/studentTypes";
import { defineStore } from "pinia";
import { ref, type Ref } from "vue";

export const useglobalDataStore = defineStore("globalDataStore", () => {
  const students: Ref<Array<Student>> = ref([]);
  const courses: Ref<Array<Course>> = ref([]);

  let fetchedStudents = false;
  let fetchedCourses = false;

  async function loadStudents() {
    const resp = await getStudents(0, 1000, {
      sort: { by: "id", direction: "desc" },
    });
    if (resp.status == "success") {
      fetchedStudents = true;
      students.value = resp.data.students;
    }
  }

  if (!fetchedStudents)
    setInterval(() => {
      loadStudents();
    }, 10000);

  async function loadCourses() {
    const resp = await getCourses(0, 1000, {
      sort: { by: "id", direction: "desc" },
    });
    if (resp.status == "success") {
      fetchedCourses = true;
      courses.value = resp.data.courses;
    }
  }

  if (!fetchedCourses)
    setInterval(() => {
      loadCourses();
    }, 10000);

  async function findStudent(id: number) {
    if (!fetchedStudents) await loadStudents();

    const student = students.value.find((s) => s.id == id);

    // implement to fetch student records from 1000 onwards or any way suitable
    if (!student) return null;

    return student;
  }

  async function findCourse(id: number) {
    if (!fetchedCourses) await loadCourses();

    const course = courses.value.find((s) => s.id == id);

    // implement to fetch student records from 1000 onwards or any way suitable
    if (!course) return null;

    return course;
  }

  const hooks: Ref<{ [name: string]: CallableFunction }> = ref({});

  function insertHook(name: string, fn: CallableFunction) {
    hooks.value[name] = fn;

    return true;
  }

  function removeHook(name: string) {
    if (hooks.value[name]) {
      delete hooks.value[name];
      return true;
    }
    return false;
  }

  function getHook(name: string) {
    if (!hooks.value[name]) return null;

    return hooks.value[name];
  }

  return {
    findStudent,
    findCourse,
    insertHook,
    removeHook,
    getHook,
  };
});
