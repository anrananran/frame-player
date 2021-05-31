/**
 * 灵活的序列帧播放器
 * 1.支持循环播放
 * 2.支持反向播放
 * 3.支持图片预加载
 * 4.支持横向排布（可多行）或纵向排布（可多列）的雪碧图
 */
export default class FramePlayer {
  /**
   * @param {String} container DOM选择器
   * @param {String|HTMLElement} image 图片元素或路径
   * @param {Number} width 序列帧宽度
   * @param {Number} height 序列帧高度
   * @param {Number} frameNumber 帧的数量
   * @param {String} direction 雪碧图排布方向 vertical:竖排 horizontal:横排
   */
  constructor(container, image, width, height, frameNumber, direction = 'vertical') {
    this.container = container
    this.image = image
    this.width = width
    this.height = height
    this.direction = direction
    this.min = 0
    this.max = frameNumber - 1
    this.opts = {}
    this.timer = 0
    this.times = 0
    this.index = 0
    this.ctx = null
    this.canvas = null
    this.matrix = []
  }

  /**
   * 加载图片
   * @param {String} image 图片路径
   * @returns
   */
  loadImage(image) {
    return new Promise((resolve, reject) => {
      const loadedImage = new Image()
      loadedImage.onload = () => {
        resolve(loadedImage)
      }
      loadedImage.onerror = (err) => {
        reject(err)
      }
      loadedImage.src = image
    })
  }

  /**
   * 计算雪碧图中的帧的位置
   */
  initMatrix() {
    if (this.matrix.length > 0) return
    const xLen = Math.floor(this.image.width / this.width)
    const yLen = Math.floor(this.image.height / this.height)
    if (xLen === 0 || yLen === 0) throw new TypeError('精灵图宽度或高度设置错误')
    if (this.direction === 'horizontal') {
      for (let j = 0; j < yLen; j++) {
        for (let i = 0; i < xLen; i++) {
          this.matrix.push({
            x: i * this.width,
            y: j * this.height
          })
        }
      }
    } else if (this.direction === 'vertical') {
      for (let i = 0; i < xLen; i++) {
        for (let j = 0; j < yLen; j++) {
          this.matrix.push({
            x: i * this.width,
            y: j * this.height
          })
        }
      }
    } else {
      throw new TypeError('direction参数错误，只能为horizontal或vertical')
    }
  }

  /**
   *
   * @param {Object}} options 配置参数
   * from 开始帧，默认0
   * to 结束帧, 默认最后一帧
   * loop 循环次数 0表示无限循环，默认0
   * fps 每秒帧数，默认24
   * complete 每次循环结束时的回调，默认为null
   */
  async play(options) {
    const defaultOpts = {
      from: 0,
      to: this.max,
      loop: 0,
      fps: 30,
      complete: null
    }
    this.opts = { ...defaultOpts, ...options }
    this.times = 0
    try {
      if (typeof this.image === 'string') {
        this.image = await this.loadImage(this.image)
      }
      this.initMatrix()
      this.createCanvas()
      this.drawImage()
    } catch (err) {
      console.error(err)
    }
  }

  /**
   * 创建画布
   */
  createCanvas() {
    if (this.ctx) return
    const canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    this.ctx = canvas.getContext('2d')
    document.querySelector(this.container).innerHTML = canvas
    this.canvas = canvas
  }

  /**
   * 循环绘制雪碧图内容到画布
   */
  drawImage() {
    const { from, to, fps, loop, complete } = this.opts
    clearInterval(this.timer)
    this.index = from
    this.timer = setInterval(() => {
      if (loop > 0 && this.times >= loop) {
        return clearInterval(this.timer)
      }
      this.ctx.clearRect(0, 0, this.width, this.height)
      this.ctx.drawImage(
        this.image,
        this.matrix[this.index].x,
        this.matrix[this.index].y,
        this.width,
        this.height,
        0,
        0,
        this.width,
        this.height
      )
      if (from < to) {
        this.index++
      } else if (from > to) {
        this.index--
      } else {
        if (complete) {
          complete(null, this.opts)
        }
        return clearInterval(this.timer)
      }
      if ((from < to && this.index > to) || (from > to && this.index < to)) {
        this.index = from
        this.times++
        if (complete) {
          complete(this, this.times, this.opts)
        }
      }
    }, 1000 / fps)
  }
}
