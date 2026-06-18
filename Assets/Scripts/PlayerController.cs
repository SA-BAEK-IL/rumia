using UnityEngine;

public class PlayerController : MonoBehaviour
{
    public float moveSpeed = 5f;
    public float jumpForce = 10f;
    public float beatTolerance = 0.12f;
    public float defaultBpm = 70f;

    private Rigidbody2D rb;
    private Vector2 moveDirection;
    private bool isGrounded;
    private float nextBeatTime;
    private float beatInterval;
    private bool spaceHeld;
    private float lastSpaceTime;

    void Awake()
    {
        rb = GetComponent<Rigidbody2D>();
        beatInterval = 60f / defaultBpm;
        nextBeatTime = Time.time + beatInterval;
    }

    void Update()
    {
        moveDirection = new Vector2(Input.GetAxisRaw("Horizontal"), 0f).normalized;
        if (Input.GetKey(KeyCode.Space))
        {
            spaceHeld = true;
            lastSpaceTime = Time.time;
            CheckBeat(Time.time);
        }
        else if (Input.GetKeyUp(KeyCode.Space))
        {
            spaceHeld = false;
            lastSpaceTime = Time.time;
        }

        if (Input.GetKeyDown(KeyCode.C))
        {
            GameManager.Instance.ToggleMovementPause();
        }
    }

    void FixedUpdate()
    {
        if (GameManager.Instance.IsMovementPaused)
            return;

        Vector2 velocity = rb.velocity;
        velocity.x = moveDirection.x * moveSpeed;
        rb.velocity = velocity;
    }

    private void CheckBeat(float currentTime)
    {
        float delta = currentTime - nextBeatTime;
        if (Mathf.Abs(delta) <= beatTolerance)
        {
            nextBeatTime += beatInterval;
            // TODO: 플레이어 박자 성공 이펙트
        }
        else
        {
            GameManager.Instance.OnBeatFail(delta > 0 ? "정지 - 박자를 놓쳤습니다" : "과부하 - 박자를 너무 빨리 누르셨습니다");
        }
    }

    public void SetBpm(float bpm)
    {
        beatInterval = 60f / bpm;
        nextBeatTime = Time.time + beatInterval;
    }

    public bool IsSpaceHeldLongEnough()
    {
        return spaceHeld || Time.time - lastSpaceTime <= 0.35f;
    }
}
