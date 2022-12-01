'use strict';

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
      <span class="star"><i class="far fa-star"></i></span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

// Similar function but slightly different markup for favorite stories

function generateFaveStoryMarkup(story) {
  const hostName = story.getHostName();
  return $(`
      <li id="FV${story.storyId}">
      <span class="fvstar"><i class="fas fa-star"></i></span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

// Similar function for userStory but slightly different HTML markup for userStory

function generateUserStoryMarkup(story) {
  const hostName = story.getHostName();
  return $(`<li id="user${story.storyId}">
  <span class="trash"><i class="fas fa-trash-alt"></i></span>
  <span class="userstar"><i class="far fa-star"></i></span>
    <a href="${story.url}" target="a_blank" class="story-link">
      ${story.title}
    </a>
    <small class="story-hostname">(${hostName})</small>
    <small class="story-author">by ${story.author}</small>
    <small class="story-user">posted by ${story.username}</small>
  </li>`);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */
function putStoriesOnPage() {
  console.debug('putStoriesOnPage');

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }
  // Checks to see if user logged in
  if (currentUser) {
    for (let story of storyList.stories) {
      for (let faveStory of currentUser.favorites)
        if (story.storyId === faveStory.storyId) {
          turnFaveStarOn(faveStory.storyId);
        }
    }
  }
  $allStoriesList.show();
}
// Updates list of favorite stories to DOM
function putFaveStoriesOnPage() {
  console.debug('putFaveStoriesOnPage');
  const user = currentUser;
  $faveStoriesList.empty();

  // Loop through user's favorite stories and generate HTML for them
  for (let story of user.favorites) {
    const $story = generateFaveStoryMarkup(story);
    $faveStoriesList.append($story);
  }
}

// Updates list of userStories
function putUserStoriesOnPage() {
  console.debug('putUserStoriesOnPage');
  const user = currentUser;
  $userStoriesList.empty();
  for (let story of user.ownStories) {
    const $story = generateUserStoryMarkup(story);
    $userStoriesList.append($story);
  }
}

//Shows favorite stories
function showFaveStories() {
  $allStoriesList.hide();
  putFaveStoriesOnPage();
  $faveStoriesList.show();
  for (let story of currentUser.favorites) {
    turnFaveStarOn(story.storyId);
  }
}

// Manipulates user stories section of DOM
function showUserStories() {
  $allStoriesList.hide();
  hidePageComponents();
  putUserStoriesOnPage();
  $userStoriesList.show();
  for (let story of currentUser.ownStories) {
    if (checkFavoritesForStoryId(story.storyId)) {
      const star = $(`#user${story.storyId}`).children()[1];
      $(star).html('<i class="fas fa-star"></i>');
    }
  }
}

// Adds story to favorites based on storyID
async function addFaveStory(storyId) {
  const user = currentUser;
  if (user)
    try {
      const story = new Story(await getStoryById(storyId));
      await user.addFavorite(user, story);
      turnFaveStarOn(storyId);
      putFaveStoriesOnPage();
    } catch (e) {
      console.log(e);
    }
}

// Removes story from favorites based on storyID
async function removeFaveStory(storyId) {
  const user = currentUser;
  try {
    const story = new Story(await getStoryById(storyId));
    await user.removeFavorite(user, story);
    turnFaveStarOff(storyId);
    putFaveStoriesOnPage();
  } catch (e) {
    console.log(e);
  }
}

// Sends story from $submitForm to Backend API
async function submitStory(event) {
  console.debug('submitStory', event);
  event.preventDefault();
  const user = currentUser;
  const newStory = {
    author: $('#create-author').val(),
    title: $('#create-title').val(),
    url: $('#create-url').val(),
  };
  try {
    await storyList.addStory(user, newStory);
  } catch (e) {
    console.log(e);
  }
  try {
    storyList = await StoryList.getStories();
    putStoriesOnPage();
  } catch (e) {
    console.log(e);
  }
}

// Deletes story and updates Stories on page
async function deleteStory(storyId) {
  const user = currentUser;
  await storyList.deleteStory(user, storyId);
  showUserStories();
}

// Checks if storyID is in favorites
function checkFavoritesForStoryId(storyId) {
  for (let story of currentUser.favorites) {
    if (story.storyId === storyId) {
      return true;
    }
  }
  return false;
}

$submitForm.on('submit', submitStory);

// Gets story from API based on storyID
async function getStoryById(storyId) {
  const story = await axios.get(`${BASE_URL}/stories/${storyId}`);
  return story.data.story;
}