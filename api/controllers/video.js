const pool = require('../pool')
const {poolQuery} = require('../helpers')

const {requireAuth} = require('../auth')
const {
  processedString,
  processedTitleString,
  fetchedVideoCodeFromURL,
  stringIsEmpty
} = require('../helpers/stringHelpers')
const {
  deleteComments,
  editComments,
  likeComments,
  postComments,
  fetchComments,
  returnComments,
  fetchReplies,
  postReplies
} = require('../helpers/commentHelpers')

const async = require('async')
const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  const videoId = Number(req.query.videoId) || 0
  const numberToLoad = Number(req.query.numberToLoad) + 1 || 13
  const where = videoId === 0 ? '' : 'WHERE a.id < ? '
  const query = [
    'SELECT a.id, a.title, a.description, a.content, a.uploader AS uploaderId, b.username AS uploaderName, ',
    'COUNT(c.id) AS numLikes ',
    'FROM vq_videos a LEFT JOIN users b ON a.uploader = b.id ',
    'LEFT JOIN vq_video_likes c ON a.id = c.videoId ',
    where,
    'GROUP BY a.id ',
    'ORDER BY a.id DESC LIMIT ' + numberToLoad
  ].join('')
  pool.query(query, videoId, (err, rows) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.json(rows)
  })
})

router.post('/', requireAuth, (req, res) => {
  const user = req.user
  const {title, description, url, selectedCategory} = req.body
  const post = {
    title: processedTitleString(title),
    description: processedString(description),
    content: fetchedVideoCodeFromURL(url),
    categoryId: selectedCategory,
    uploader: user.id,
    timeStamp: Math.floor(Date.now()/1000)
  }

  pool.query('INSERT INTO vq_videos SET ?', post, (err, row) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    let result = Object.assign({}, post, {
      id: row.insertId,
      uploaderId: user.id,
      uploaderName: user.username,
      numLikes: 0
    })
    res.json({result})
  })
})

router.delete('/', requireAuth, (req, res) => {
  const user = req.user
  const videoId = req.query.videoId !== 'undefined' ? Number(req.query.videoId) : 0
  const lastVideoId = req.query.lastVideoId !== 'undefined' ? Number(req.query.lastVideoId) : 0

  async.parallel([
    (callback) => {
      pool.query('DELETE FROM vq_videos WHERE id = ? AND uploader = ?', [videoId, user.id], (err) => {
        callback(err)
      })
    },
    (callback) => {
      const query = [
        'SELECT a.id, a.title, a.description, a.content, a.uploader AS uploaderId, b.username AS uploaderName ',
        'FROM vq_videos a LEFT JOIN users b ON a.uploader = b.id ',
        'WHERE a.id < ? ',
        'ORDER BY a.id DESC LIMIT 1'
      ].join('')
      pool.query(query, lastVideoId, (err, rows) => {
        callback(err, rows)
      })
    }
  ], (err, results) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.json({result: results[1]})
  })
})

router.post('/edit/title', requireAuth, (req, res) => {
  const user = req.user
  const title = req.body.title
  const videoId = req.body.videoId
  const newTitle = processedTitleString(title)
  const post = { title: newTitle }

  const userId = user.id
  pool.query('UPDATE vq_videos SET? WHERE id = ? AND uploader = ?', [post, videoId, userId], err => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send({result: newTitle})
  })
})

router.post('/like', requireAuth, (req, res) => {
  const {user, body: {contentId: videoId}} = req
  return poolQuery('SELECT * FROM vq_video_likes WHERE videoId = ? AND userId = ?', [videoId, user.id]).then(
    rows => {
      if (rows.length > 0) {
        return poolQuery('DELETE FROM vq_video_likes WHERE videoId = ? AND userId = ?', [videoId, user.id])
      } else {
        return poolQuery('INSERT INTO vq_video_likes SET ?', {videoId, userId: user.id})
      }
    }
  ).then(
    () => {
      const query = `
        SELECT a.userId, b.username
        FROM vq_video_likes a LEFT JOIN users b ON a.userId = b.id
        WHERE a.videoId = ?
      `
      return poolQuery(query, videoId)
    }
  ).then(
    rows => res.send({likes: rows})
  ).catch(
    err => {
      console.error(err)
      res.status(500).send({error: err})
    }
  )
})

router.post('/edit/page', requireAuth, (req, res) => {
  const user = req.user
  let videoId = req.body.videoId
  let title = req.body.title
  let description = req.body.description
  if (stringIsEmpty(title)) {
    return res.status(500).send({error: 'Title is empty'})
  }
  const post = {title, description: processedString(description)}
  const userId = user.id
  pool.query('UPDATE vq_videos SET ? WHERE id = ? AND uploader = ?', [post, videoId, userId], err => {
    if (err) {
      console.error(err)
      return res.status(500).json({error: err})
    }
    res.json({success: true})
  })
})

router.get('/page', (req, res) => {
  const {videoId} = req.query
  let query = `
    SELECT a.id AS videoId, a.title, a.description, a.content, a.timeStamp,
    a.uploader AS uploaderId, b.username AS uploaderName,
    (SELECT COUNT(*) FROM vq_video_views WHERE videoId = ?) AS videoViews
    FROM vq_videos a LEFT JOIN users b ON a.uploader = b.id
    WHERE a.id = ?
  `
  let finalResults

  return poolQuery(query, [videoId, videoId]).then(
    rows => {
      finalResults = rows[0]
      const {videoId} = finalResults
      const query1 = 'SELECT * FROM vq_questions WHERE videoId = ? AND isDraft = 0'
      const query2 = `
        SELECT a.userId, b.username
        FROM vq_video_likes a LEFT JOIN users b ON a.userId = b.id
        WHERE a.videoId = ?
      `
      return Promise.all([
        poolQuery(query1, videoId).then(
          rows => {
            let questions = rows.map(row => ({
              title: row.title,
              choices: [
                row.choice1,
                row.choice2,
                row.choice3,
                row.choice4,
                row.choice5
              ],
              correctChoice: row.correctChoice
            }))
            return Promise.resolve(questions)
          }
        ),
        poolQuery(query2, videoId).then(
          rows => Promise.resolve(rows)
        )
      ])
    }
  ).then(
    results => res.send(Object.assign({}, finalResults, {
      questions: results[0],
      likes: results[1]
    }))
  ).catch(
    err => {
      console.error(err)
      return res.status(500).send({error: err})
    }
  )
})

router.get('/comments', fetchComments)

router.post('/comments', requireAuth, postComments)

router.put('/comments', requireAuth, editComments)

router.delete('/comments', requireAuth, deleteComments)

router.post('/comments/like', requireAuth, likeComments)

router.get('/replies', fetchReplies)

router.post('/replies', requireAuth, postReplies)

router.delete('/debates', requireAuth, (req, res) => {
  const {user} = req
  const {discussionId} = req.query
  const query = 'DELETE FROM content_discussions WHERE id = ? AND userId = ?'
  pool.query(query, [discussionId, user.id], err => {
    if (err) {
      console.error(err)
      return res.status(500).send(err)
    }
    res.send({success: true})
  })
})

router.get('/debates', (req, res) => {
  const {videoId, lastDiscussionId} = req.query
  const limit = 4
  const where = lastDiscussionId ? 'AND a.id < ' + lastDiscussionId + ' ' : ''
  const query = [
    'SELECT a.id, a.userId, a.title, a.description, a.timeStamp, b.username, ',
    '(SELECT COUNT(*) FROM content_comments WHERE discussionId = a.id) AS numComments ',
    'FROM content_discussions a LEFT JOIN users b ON a.userId = b.id ',
    'WHERE a.rootType = \'video\' AND a.rootId = ? ', where,
    'ORDER BY a.id DESC LIMIT ' + limit
  ].join('')
  pool.query(query, videoId, (err, rows) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send(rows.map(row => Object.assign({}, row, {
      comments: [],
      loadMoreDebateCommentsButton: false
    })))
  })
})

router.get('/debates/comments', (req, res) => {
  const {discussionId, lastCommentId} = req.query
  const limit = 4
  const where = !!lastCommentId && lastCommentId !== '0' ? 'AND a.id < ' + lastCommentId + ' ' : ''
  const query = `
    SELECT a.id, a.userId, a.content, a.timeStamp, b.username, c.id AS profilePicId
    FROM content_comments a LEFT JOIN users b ON a.userId = b.id LEFT JOIN users_photos c ON
    a.userId = c.userId AND c.isProfilePic = '1'
    WHERE a.discussionId = ? AND a.commentId IS NULL ${where}
    ORDER BY a.id DESC LIMIT ${limit}
  `
  pool.query(query, discussionId, (err, rows) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    if (rows.length === 0) {
      return res.send([])
    }
    returnComments(rows, 'video').then(
      commentsArray => res.send(commentsArray)
    ).catch(
      err => {
        console.error(err)
        return res.status(500).send({error: err})
      }
    )
  })
})

router.post('/debates', requireAuth, (req, res) => {
  const {title, description, videoId} = req.body
  const {user} = req
  const query = 'INSERT INTO content_discussions SET ?'
  const post = {
    title: processedTitleString(title),
    description: !!description && description !== '' ? processedString(description) : null,
    userId: user.id,
    rootType: 'video',
    rootId: videoId,
    timeStamp: Math.floor(Date.now()/1000)
  }
  pool.query(query, post, (err, result) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send(Object.assign({}, post, {
      id: result.insertId,
      username: user.username,
      comments: [],
      loadMoreDebateCommentsButton: false
    }))
  })
})

router.post('/debates/edit', requireAuth, (req, res) => {
  const {user} = req
  const {discussionId, editedTitle, editedDescription} = req.body
  const post = {title: editedTitle, description: processedString(editedDescription)}
  const query = 'UPDATE content_discussions SET ? WHERE id = ? AND userId = ?'
  pool.query(query, [post, discussionId, user.id], (err) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send(post)
  })
})

router.post('/debates/comments', requireAuth, (req, res) => {
  const {rootId, rootType, discussionId, content} = req.body
  const {user} = req
  const query = 'INSERT INTO content_comments SET ?'
  const post = {
    userId: user.id,
    content: processedString(content),
    timeStamp: Math.floor(Date.now()/1000),
    rootId,
    rootType,
    discussionId
  }
  pool.query(query, post, (err, result) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send(Object.assign({}, post, {
      id: result.insertId,
      likes: [],
      replies: [],
      profilePicId: user.profilePicId,
      username: user.username
    }))
  })
})

router.post('/replies/edit', requireAuth, (req, res) => {
  const user = req.user
  const content = processedString(req.body.editedReply)
  const replyId = req.body.replyId

  pool.query('UPDATE content_comments SET ? WHERE id = ? AND userId = ?', [{content}, replyId, user.id], err => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send({success: true})
  })
})

router.post('/questions', requireAuth, (req, res) => {
  const user = req.user
  const videoId = req.body.videoId
  const questions = req.body.questions
  async.waterfall([
    (callback) => {
      const userId = user.id
      pool.query('DELETE FROM vq_questions WHERE videoId = ? AND creator = ?', [videoId, userId], err => {
        callback(err, userId)
      })
    },
    (userId, callback) => {
      let taskArray = []
      for (let i = 0; i < questions.length; i++) {
        taskArray.push(callback => {
          pool.query('INSERT INTO vq_questions SET ?', questions[i], err => {
            callback(err)
          })
        })
      }
      async.series(taskArray, (err, results) => {
        callback(err, true)
      })
    }
  ], (err, success) => {
    if (err) {
      console.error(err)
      return res.status(500).json({error: err})
    }
    res.json({success})
  })
})

router.get('/search', (req, res) => {
  const searchQuery = req.query.query
  if (stringIsEmpty(searchQuery) || searchQuery.length < 2) return res.send({result: []})
  async.waterfall([
    callback => {
      let query = 'SELECT id, title AS label FROM vq_videos WHERE title LIKE ? ORDER BY id DESC LIMIT 20'
      pool.query(query, '%' + searchQuery + '%', (err, result) => {
        callback(err, result)
      })
    }
  ], (err, result) => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send({result})
  })
})

router.post('/view', (req, res) => {
  const {videoId, userId} = req.body
  const post = {videoId, userId, timeStamp: Math.floor(Date.now()/1000)}
  pool.query('INSERT INTO vq_video_views SET ?', post, err => {
    if (err) {
      console.error(err)
      return res.status(500).send({error: err})
    }
    res.send({success: true})
  })
})

module.exports = router
