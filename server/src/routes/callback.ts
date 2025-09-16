import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

interface KieCallbackPayload {
  taskId: string;
  state: 'pending' | 'running' | 'success' | 'fail';
  resultJson?: string;
  failMsg?: string;
  progress?: number;
  userId?: string;
  model?: string;
  originalPrompt?: string;
}

// KIE AI 작업 완료 콜백 엔드포인트
router.post('/kie', async (req: Request, res: Response) => {
  try {
    const payload: KieCallbackPayload = req.body;

    console.log('KIE Callback received:', {
      taskId: payload.taskId,
      state: payload.state,
      hasResult: !!payload.resultJson,
      error: payload.failMsg
    });

    // taskId 유효성 검사
    if (!payload.taskId) {
      return res.status(400).json({ error: 'TaskId is required' });
    }

    // 콜백 데이터를 데이터베이스에 저장
    const { error: callbackError } = await supabase
      .from('kie_callbacks')
      .upsert({
        task_id: payload.taskId,
        state: payload.state,
        result_json: payload.resultJson || null,
        fail_msg: payload.failMsg || null,
        progress: payload.progress || 0,
        received_at: new Date().toISOString()
      }, {
        onConflict: 'task_id'
      });

    if (callbackError) {
      console.error('Failed to save callback data:', callbackError);
    }

    // 작업이 완료된 경우 처리
    if (payload.state === 'success' || payload.state === 'fail') {
      await handleTaskCompletion(payload);
    }

    // 진행 중인 경우 진행률 업데이트
    if (payload.state === 'running' && payload.progress) {
      await updateTaskProgress(payload.taskId, payload.progress);
    }

    // 성공 응답
    res.status(200).json({
      success: true,
      message: 'Callback processed successfully',
      taskId: payload.taskId,
      state: payload.state
    });

  } catch (error) {
    console.error('KIE Callback processing error:', error);
    res.status(500).json({
      error: 'Failed to process callback',
      taskId: req.body?.taskId
    });
  }
});

/**
 * 작업 완료 처리 함수
 */
async function handleTaskCompletion(payload: KieCallbackPayload): Promise<void> {
  try {
    // 1. 작업 결과를 generation_history 테이블에서 찾기
    const { data: historyItems, error: historyError } = await supabase
      .from('generation_history')
      .select('*')
      .eq('settings->>task_id', payload.taskId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (historyError) {
      console.error('Failed to find history item:', historyError);
      return;
    }

    if (!historyItems || historyItems.length === 0) {
      console.warn(`No history item found for taskId: ${payload.taskId}`);
      return;
    }

    const historyItem = historyItems[0];

    // 2. 작업 성공 시 결과 업데이트
    if (payload.state === 'success' && payload.resultJson) {
      try {
        const result = JSON.parse(payload.resultJson);
        const images = result.images || (result.image ? [result.image] : []);

        // generation_history 업데이트
        const { error: updateError } = await supabase
          .from('generation_history')
          .update({
            status: 'completed',
            images: images,
            error_message: null,
            settings: {
              ...historyItem.settings,
              callback_received_at: new Date().toISOString(),
              processing_completed: true
            }
          })
          .eq('id', historyItem.id);

        if (updateError) {
          console.error('Failed to update history item:', updateError);
        } else {
          console.log(`Task ${payload.taskId} completed successfully with ${images.length} images`);

          // 사용자에게 알림 전송
          await sendNotificationToUser(historyItem.user_id, {
            type: 'generation_completed',
            taskId: payload.taskId,
            model: historyItem.model,
            imageCount: images.length,
            prompt: historyItem.prompt
          });
        }

      } catch (parseError) {
        console.error('Failed to parse result JSON:', parseError);
      }
    }

    // 3. 작업 실패 시 에러 업데이트
    if (payload.state === 'fail') {
      const { error: updateError } = await supabase
        .from('generation_history')
        .update({
          status: 'failed',
          error_message: payload.failMsg || 'Task failed',
          settings: {
            ...historyItem.settings,
            callback_received_at: new Date().toISOString(),
            processing_failed: true
          }
        })
        .eq('id', historyItem.id);

      if (updateError) {
        console.error('Failed to update failed history item:', updateError);
      } else {
        console.log(`Task ${payload.taskId} failed: ${payload.failMsg}`);

        // 사용자에게 실패 알림 전송
        await sendNotificationToUser(historyItem.user_id, {
          type: 'generation_failed',
          taskId: payload.taskId,
          model: historyItem.model,
          error: payload.failMsg || 'Unknown error',
          prompt: historyItem.prompt
        });
      }
    }

  } catch (error) {
    console.error('Task completion handling error:', error);
  }
}

/**
 * 작업 진행률 업데이트
 */
async function updateTaskProgress(taskId: string, progress: number): Promise<void> {
  try {
    // generation_history에서 해당 작업 찾기
    const { data: historyItems, error: historyError } = await supabase
      .from('generation_history')
      .select('*')
      .eq('settings->>task_id', taskId)
      .limit(1);

    if (historyError || !historyItems || historyItems.length === 0) {
      return;
    }

    const historyItem = historyItems[0];

    // 진행률 업데이트
    const { error: updateError } = await supabase
      .from('generation_history')
      .update({
        settings: {
          ...historyItem.settings,
          progress: progress,
          last_progress_update: new Date().toISOString()
        }
      })
      .eq('id', historyItem.id);

    if (!updateError) {
      // 사용자에게 진행률 알림 전송
      await sendNotificationToUser(historyItem.user_id, {
        type: 'generation_progress',
        taskId: taskId,
        progress: progress,
        model: historyItem.model
      });
    }

  } catch (error) {
    console.error('Progress update error:', error);
  }
}

/**
 * 사용자에게 알림 전송 (웹소켓/SSE)
 * 현재는 로그만 출력, 추후 실제 알림 시스템 구현
 */
async function sendNotificationToUser(userId: string, notification: any): Promise<void> {
  try {
    console.log(`Notification for user ${userId}:`, notification);

    // TODO: 실제 웹소켓이나 SSE를 통한 실시간 알림 구현
    // 예시:
    // if (webSocketConnections[userId]) {
    //   webSocketConnections[userId].send(JSON.stringify(notification));
    // }

    // 또는 Server-Sent Events 사용:
    // if (sseConnections[userId]) {
    //   sseConnections[userId].write(`data: ${JSON.stringify(notification)}\n\n`);
    // }

    // 현재는 알림 로그를 데이터베이스에 저장
    const { error } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        type: notification.type,
        title: getNotificationTitle(notification),
        message: getNotificationMessage(notification),
        data: notification,
        is_read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to save notification:', error);
    }

  } catch (error) {
    console.error('Send notification error:', error);
  }
}

/**
 * 알림 제목 생성
 */
function getNotificationTitle(notification: any): string {
  switch (notification.type) {
    case 'generation_completed':
      return '이미지 생성 완료';
    case 'generation_failed':
      return '이미지 생성 실패';
    case 'generation_progress':
      return '이미지 생성 중';
    default:
      return '알림';
  }
}

/**
 * 알림 메시지 생성
 */
function getNotificationMessage(notification: any): string {
  switch (notification.type) {
    case 'generation_completed':
      return `${notification.model} 모델로 ${notification.imageCount}개의 이미지가 생성되었습니다.`;
    case 'generation_failed':
      return `${notification.model} 모델 처리 중 오류가 발생했습니다: ${notification.error}`;
    case 'generation_progress':
      return `${notification.model} 처리 진행률: ${notification.progress}%`;
    default:
      return '새로운 알림이 있습니다.';
  }
}

// 테스트용 엔드포인트
router.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'Callback service is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      kie_callback: 'POST /api/callback/kie'
    }
  });
});

export default router;