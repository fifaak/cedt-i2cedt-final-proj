import { elements } from "./dom.js";

export function getUserInfoFromForm() {
  return {
    name: elements.userNameInput.value,
    gender: elements.userGenderSelect.value,
    dob: elements.userDobInput.value,
    topicValue: elements.topicSelect.value,
  };
}


