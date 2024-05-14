import {
  sendDeleteRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest
} from '@/baseFunctions/requests'

export function getCourses() {
  return sendGetRequest('/courses')
}

export function createCourse(
  name,
  instructor_id,
  day,
  start_time,
  end_time,
  venue,
  fee_type,
  amount
) {
  let t = `${start_time}-${end_time}`

  return sendJsonPostRequest('/courses', {
    name: name,
    instructor_id: instructor_id,
    enrollment_open: true,
    mode: 'physical',
    schedule: [
      {
        day: day,
        time: t,
        mode: 'physical',
        venue: venue
      }
    ],
    fee: {
      type: fee_type,
      amount: amount
    }
  })
}

export function updateCourse(
  id,
  name,
  instructor_id,
  day,
  start_time,
  end_time,
  venue,
  fee_type,
  amount
) {
  let t = `${start_time}-${end_time}`

  return sendJsonPatchRequest(`/courses/${id}`, {
    name: name,
    instructor_id: instructor_id,
    enrollment_open: true,
    mode: 'physical',
    schedule: [
      {
        day: day,
        time: t,
        mode: 'physical',
        venue: venue
      }
    ],
    fee: {
      type: fee_type,
      amount: amount
    }
  })
}

export function deleteCourse(id) {
  return sendDeleteRequest(`/courses/${id}`)
}
