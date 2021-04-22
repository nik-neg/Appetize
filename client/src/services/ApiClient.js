const baseUrl = 'http://localhost:3001';
const registerUser = (user) => {
  // console.log(user);
  return fetch(`${baseUrl}/register`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }
  )
    .then((data) => data.json())
    .then((userData) => userData)
    .catch((err) => console.log(err));
};

const loginUser = (user) => {
  // console.log(user);
  return fetch(`${baseUrl}/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }
  )
    .then((data) => data.json())
    .then((userData) => userData)
    .catch((err) => console.log(err));
};

const getProfile = (id) => {
  console.log("GET PROFILE BY CLIENT")
  return fetch(`${baseUrl}/profile/${id}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  )
    .then((data) => data.json())
    .then((user) => user)
    .catch((err) => console.log(err));
};

const uploadImage = (files) => {
  var formData = new FormData();
  formData.append('file', files[0]);

  return fetch(`${baseUrl}/profile`, {
    method: 'POST',
    body: formData
  })
    .then((data) => data.json())
    .then((user) => user)
    .catch((err) => console.log(err));
}

  module.exports = { loginUser, registerUser, getProfile, uploadImage };
