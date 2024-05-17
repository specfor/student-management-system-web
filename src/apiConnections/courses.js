import {
  sendDeleteRequest,
  sendJsonPatchRequest,
  sendJsonPostRequest,
  sendGetRequest
} from '@/baseFunctions/requests'

export function getCourses(startIndex = 0, limit = null) {
  let params = { start: startIndex }
  if (limit) params['size'] = limit
  return sendGetRequest('/courses', params)
}

export function createCourse(
  name,
  group_name,
  instructor_id,
  day,
  start_time,
  end_time,
  venue,
  fee_type,
  amount,
  grade_id
) {
  let t = `${start_time}-${end_time}`

  return sendJsonPostRequest('/courses', {
    name: name,
    group_name: group_name,
    grade_id: grade_id,
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
  group_name,
  instructor_id,
  day,
  start_time,
  end_time,
  venue,
  fee_type,
  amount,
  grade_id
) {
  let t = `${start_time}-${end_time}`

  return sendJsonPatchRequest(`/courses/${id}`, {
    name: name,
    group_name: group_name,
    grade_id: grade_id,
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
